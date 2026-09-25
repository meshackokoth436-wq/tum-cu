import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { NotFoundError } from '../../../utils/errors';

export interface WeeklyProgramme {
  id: string;
  day: string;
  title: string;
  programme_type?: string;
  time: string;
  venue: string;
  leader?: string;
  description?: string;
  alternating_enabled?: number;
  interval_type?: string;
  alternate_a_title?: string;
  alternate_b_title?: string;
  anchor_monday?: string;
  anchor_programme?: string;
  is_configurable?: number;
  created_at?: string;
  updated_at?: string;
  active_this_week_title?: string;
  alternating_info?: Record<string, any>;
}

const DAY_ORDER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

// Calculate Monday activity based on anchor: 2026-09-21 = E-Teams Fellowship
export function calculateMondaySchedule(targetDate: Date = new Date()) {
  const d = new Date(targetDate);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  // Get Monday of that week
  const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
  const currentMonday = new Date(d.getFullYear(), d.getMonth(), diffToMon);
  currentMonday.setHours(0, 0, 0, 0);

  // Anchor Monday: 2026-09-21 was E-Teams Fellowship
  const anchorMonday = new Date(2026, 8, 21); // Month is 0-indexed, so 8 is September
  anchorMonday.setHours(0, 0, 0, 0);

  const diffMs = currentMonday.getTime() - anchorMonday.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  const isETeams = Math.abs(diffWeeks) % 2 === 0;

  const currentTitle = isETeams ? 'E-Teams Fellowship' : 'Door to Door Evangelism';
  const nextTitle = isETeams ? 'Door to Door Evangelism' : 'E-Teams Fellowship';

  // Generate next 12 Mondays forecast
  const upcomingMondays = [];
  for (let i = 0; i < 12; i++) {
    const nextMon = new Date(currentMonday);
    nextMon.setDate(currentMonday.getDate() + i * 7);
    const wDiff = Math.round((nextMon.getTime() - anchorMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const isET = Math.abs(wDiff) % 2 === 0;
    upcomingMondays.push({
      date: nextMon.toISOString().split('T')[0],
      title: isET ? 'E-Teams Fellowship' : 'Door to Door Evangelism',
      type: isET ? 'eteams' : 'evangelism',
      description: isET
        ? 'Regional fellowship at designated team centers (NORET, SORET) focusing on prayer, mission planning, and discipleship.'
        : 'Grassroots door-to-door campus and hostel gospel outreach, personal evangelism, and tract distribution.',
    });
  }

  return {
    thisMondayDate: currentMonday.toISOString().split('T')[0],
    isETeams,
    currentTitle,
    nextTitle,
    upcomingMondays,
  };
}

class ProgrammesController {
  list = asyncHandler(async (_req: Request, res: Response) => {
    const rows = await query<WeeklyProgramme[]>('SELECT * FROM weekly_programmes');
    const monSchedule = calculateMondaySchedule();

    const enriched = rows.map((p) => {
      if (p.day?.toLowerCase() === 'monday') {
        return {
          ...p,
          active_this_week_title: monSchedule.currentTitle,
          alternating_info: {
            current_week_activity: monSchedule.currentTitle,
            next_week_activity: monSchedule.nextTitle,
            this_monday_date: monSchedule.thisMondayDate,
            rule: 'Alternating every Monday between E-Teams Fellowship and Door to Door Evangelism',
            upcoming_mondays: monSchedule.upcomingMondays,
          },
        };
      }
      return p;
    });

    const sorted = [...enriched].sort((a, b) => {
      const orderA = DAY_ORDER[a.day?.toLowerCase()?.trim()] ?? 99;
      const orderB = DAY_ORDER[b.day?.toLowerCase()?.trim()] ?? 99;
      return orderA - orderB;
    });

    return sendSuccess(res, sorted, 'Weekly programmes retrieved', 200, {
      total: sorted.length,
      monday_schedule: monSchedule,
    });
  });

  getMondayForecast = asyncHandler(async (_req: Request, res: Response) => {
    const schedule = calculateMondaySchedule();
    return sendSuccess(res, schedule, 'Monday alternating schedule forecast retrieved');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const rows = await query<WeeklyProgramme[]>('SELECT * FROM weekly_programmes WHERE id = :id LIMIT 1', {
      id: req.params.id,
    });
    if (!rows.length) throw new NotFoundError('Programme');
    const p = rows[0];
    if (p.day?.toLowerCase() === 'monday') {
      const monSchedule = calculateMondaySchedule();
      return sendSuccess(res, {
        ...p,
        active_this_week_title: monSchedule.currentTitle,
        alternating_info: monSchedule,
      }, 'Programme retrieved');
    }
    return sendSuccess(res, p, 'Programme retrieved');
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const id = req.body.id || uuidv4();
    const newProg: WeeklyProgramme = {
      id,
      day: req.body.day || 'Sunday',
      title: req.body.title || 'Fellowship Program',
      programme_type: req.body.programme_type || req.body.type || 'fellowship',
      time: req.body.time || '5:00 PM – 7:00 PM',
      venue: req.body.venue || 'Main Sanctuary',
      leader: req.body.leader || '',
      description: req.body.description || '',
      alternating_enabled: req.body.alternating_enabled ? 1 : 0,
      interval_type: req.body.interval_type || 'weekly',
      created_at: new Date().toISOString(),
    };

    await query(
      `INSERT INTO weekly_programmes (id, day, title, programme_type, time, venue, leader, description, alternating_enabled, created_at)
       VALUES (:id, :day, :title, :programme_type, :time, :venue, :leader, :description, :alternating_enabled, :created_at)`,
      newProg as unknown as Record<string, unknown>
    );

    return sendSuccess(res, newProg, 'Weekly programme created successfully', 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const existing = await query<WeeklyProgramme[]>('SELECT * FROM weekly_programmes WHERE id = :id LIMIT 1', { id });
    if (!existing.length) throw new NotFoundError('Programme');

    const updated: WeeklyProgramme = {
      ...existing[0],
      day: req.body.day !== undefined ? req.body.day : existing[0].day,
      title: req.body.title !== undefined ? req.body.title : existing[0].title,
      programme_type: req.body.programme_type !== undefined ? req.body.programme_type : existing[0].programme_type,
      time: req.body.time !== undefined ? req.body.time : existing[0].time,
      venue: req.body.venue !== undefined ? req.body.venue : existing[0].venue,
      leader: req.body.leader !== undefined ? req.body.leader : existing[0].leader,
      description: req.body.description !== undefined ? req.body.description : existing[0].description,
      alternating_enabled: req.body.alternating_enabled !== undefined ? (req.body.alternating_enabled ? 1 : 0) : existing[0].alternating_enabled,
      updated_at: new Date().toISOString(),
    };

    await query(
      `UPDATE weekly_programmes SET day = :day, title = :title, programme_type = :programme_type, time = :time, venue = :venue, leader = :leader, description = :description, alternating_enabled = :alternating_enabled, updated_at = :updated_at WHERE id = :id`,
      updated as unknown as Record<string, unknown>
    );

    return sendSuccess(res, updated, 'Weekly programme updated successfully');
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    await query('DELETE FROM weekly_programmes WHERE id = :id', { id });
    return sendSuccess(res, null, 'Weekly programme removed successfully');
  });

  // Downloadable iCalendar (.ics) export containing all semester events and recurring weekly programmes
  downloadIcs = asyncHandler(async (_req: Request, res: Response) => {
    const events = await query<any[]>('SELECT * FROM events');
    const programmes = await query<WeeklyProgramme[]>('SELECT * FROM weekly_programmes');

    function formatIcsDate(dateStr: string): string {
      const d = new Date(dateStr);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    function cleanString(str: string): string {
      return (str || '').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    }

    const now = formatIcsDate(new Date().toISOString());

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Technical University of Mombasa Christian Union//TUMCU Semester Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:TUMCU Semester & Weekly Programmes',
      'X-WR-TIMEZONE:Africa/Nairobi',
      'X-WR-CALDESC:Technical University of Mombasa Christian Union official semester schedule, Friday services, Sunday services, and weekly fellowships.',
    ];

    // Add semester events
    for (const evt of events) {
      const dtStart = evt.start_at ? formatIcsDate(evt.start_at) : now;
      const dtEnd = evt.end_at ? formatIcsDate(evt.end_at) : formatIcsDate(new Date(new Date(evt.start_at).getTime() + 2 * 3600000).toISOString());
      ics.push(
        'BEGIN:VEVENT',
        `UID:${evt.id || uuidv4()}@tumcu.ac.ke`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${cleanString(evt.title)}`,
        `DESCRIPTION:${cleanString((evt.description || '') + (evt.preacher ? `\\nMinister: ${evt.preacher}` : ''))}`,
        `LOCATION:${cleanString(evt.venue || evt.location || 'Main Assembly Hall')}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder: TUMCU Fellowship',
        'TRIGGER:-PT30M',
        'END:VALARM',
        'END:VEVENT'
      );
    }

    // Add recurring weekly programmes starting September 2026 to December 2026
    const dayToIcsMap: Record<string, string> = {
      monday: 'MO',
      tuesday: 'TU',
      wednesday: 'WE',
      thursday: 'TH',
      friday: 'FR',
      sunday: 'SU',
    };

    for (const prog of programmes) {
      const dayKey = prog.day?.toLowerCase();
      const byDay = dayToIcsMap[dayKey];
      if (!byDay) continue;

      // Skip Friday and Sunday if already represented by detailed single events to prevent duplicates
      if (dayKey === 'friday' || dayKey === 'sunday') continue;

      let startHour = 17;
      let startMinute = 0;
      let endHour = 19;
      let endMinute = 0;

      if (prog.time.includes('6:00 PM')) {
        startHour = 18;
        endHour = 20;
        endMinute = 30;
      } else if (prog.time.includes('8:00 AM')) {
        startHour = 8;
        endHour = 12;
        endMinute = 30;
      }

      // First week date for this day in September 2026
      const dayOffsetMap: Record<string, number> = {
        monday: 21,
        tuesday: 22,
        wednesday: 23,
        thursday: 24,
      };

      const startDay = dayOffsetMap[dayKey] || 21;
      const startDate = new Date(Date.UTC(2026, 8, startDay, startHour, startMinute, 0));
      const endDate = new Date(Date.UTC(2026, 8, startDay, endHour, endMinute, 0));

      const dtStart = formatIcsDate(startDate.toISOString());
      const dtEnd = formatIcsDate(endDate.toISOString());

      ics.push(
        'BEGIN:VEVENT',
        `UID:${prog.id || uuidv4()}@tumcu.ac.ke`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `RRULE:FREQ=WEEKLY;UNTIL=20261220T235959Z;BYDAY=${byDay}`,
        `SUMMARY:${cleanString(prog.title)}`,
        `DESCRIPTION:${cleanString(prog.description || 'TUMCU Weekly Fellowship')}`,
        `LOCATION:${cleanString(prog.venue || 'TUM Campus')}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    }

    ics.push('END:VCALENDAR');

    const icsContent = ics.join('\r\n');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tumcu-semester-program-2026.ics"');
    return res.status(200).send(icsContent);
  });
}

export const programmesController = new ProgrammesController();

