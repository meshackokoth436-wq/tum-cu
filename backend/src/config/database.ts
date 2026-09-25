import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { env } from './env';
import { logger } from '../utils/logger';

// In-memory data store for offline / preview mode
interface MemoryDB {
  tables: Record<string, Record<string, any>[]>;
}

export const memoryDb: MemoryDB = {
  tables: {
    membership_types: [
      { id: '1', code: 'full', name: 'Full Member', description: 'Full constitutional student member', created_at: new Date().toISOString() },
      { id: '2', code: 'special', name: 'Special Member', description: 'Special category member', created_at: new Date().toISOString() },
      { id: '3', code: 'associate', name: 'Associate Member', description: 'Alumni / associate member', created_at: new Date().toISOString() },
    ],
    executive_positions: [
      { id: '1', code: 'chairperson', title: 'Chairperson', display_order: 1, created_at: new Date().toISOString() },
      { id: '2', code: 'first_vice_chairperson', title: '1st Vice Chairperson', display_order: 2, created_at: new Date().toISOString() },
      { id: '3', code: 'second_vice_chairperson', title: '2nd Vice Chairperson', display_order: 3, created_at: new Date().toISOString() },
      { id: '4', code: 'secretary', title: 'Secretary', display_order: 4, created_at: new Date().toISOString() },
      { id: '5', code: 'vice_secretary', title: 'Vice Secretary', display_order: 5, created_at: new Date().toISOString() },
      { id: '6', code: 'treasurer', title: 'Treasurer', display_order: 6, created_at: new Date().toISOString() },
      { id: '7', code: 'prayer_chairperson', title: 'Prayer Committee Chairperson', display_order: 7, created_at: new Date().toISOString() },
      { id: '8', code: 'worship_chairperson', title: 'Worship Committee Chairperson', display_order: 8, created_at: new Date().toISOString() },
      { id: '9', code: 'missions_chairperson', title: 'Missions Committee Chairperson', display_order: 9, created_at: new Date().toISOString() },
      { id: '10', code: 'discipleship_chairperson', title: 'Discipleship Committee Chairperson', display_order: 10, created_at: new Date().toISOString() },
      { id: '11', code: 'assets_chairperson', title: 'Assets Committee Chairperson', display_order: 11, created_at: new Date().toISOString() },
      { id: '12', code: 'publicity_chairperson', title: 'Publicity Committee Chairperson', display_order: 12, created_at: new Date().toISOString() },
      { id: '13', code: 'non_residents_chairperson', title: 'Non-Residents Committee Chairperson', display_order: 13, created_at: new Date().toISOString() },
    ],
    leadership_positions: [
      {
        id: 'pos-1',
        code: 'chairperson',
        name: 'Chairperson',
        category: 'executive',
        description: 'Chief executive officer and spiritual visionary of TUMCU.',
        constitutional_reference: 'Article 12.1',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 1,
        responsibilities: [
          'Overall leadership, spiritual vision, and constitutional direction of TUMCU',
          'Convenes and presides over Executive Committee and General Business Meetings',
          'Official representative and signatory of the Christian Union with University & external bodies',
          'Supervises all executive officers, committees, and constitutional ministries',
          'Co-signatory for official TUMCU financial instruments and bank accounts'
        ],
        permissions: ['leadership.view', 'leadership.assign', 'meetings.view', 'meetings.create', 'events.view', 'events.approve', 'reports.view', 'finance.view', 'finance.approve', 'elections.manage'],
        constitutional_restrictions: ['Cannot unilaterally authorize financial withdrawals without Executive Committee resolution', 'Must be a full member in good standing of at least 2 spiritual years']
      },
      {
        id: 'pos-2',
        code: 'first_vice_chairperson',
        name: 'First Vice Chairperson',
        category: 'executive',
        description: 'Internal affairs and standing committee coordinator.',
        constitutional_reference: 'Article 12.2',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 2,
        responsibilities: [
          'Deputizes the Chairperson and acts in their absence',
          'Coordinates internal affairs and standing committees (Welfare, Hospitality, Prayer)',
          'Monitors constitutional compliance across all union sub-organs',
          'Oversees spiritual welfare and pastoral care among members'
        ],
        permissions: ['leadership.view', 'committees.view', 'welfare.view', 'welfare.approve', 'reports.view', 'meetings.view', 'events.view', 'attendance.view'],
        constitutional_restrictions: ['Acts as Chairperson only upon formal delegation or vacancy under Article 9']
      },
      {
        id: 'pos-3',
        code: 'second_vice_chairperson',
        name: 'Second Vice Chairperson',
        category: 'executive',
        description: 'External outreach, missions, and ministries coordinator.',
        constitutional_reference: 'Article 12.3',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 3,
        responsibilities: [
          'Coordinates external ministries (High School, Hospital, Missions, Creative)',
          'Liaises with associate members, alumni body, and partner campus Christian Unions',
          'Assists in planning joint fellowship events and inter-varsity conferences',
          'Directs evangelistic field operations'
        ],
        permissions: ['leadership.view', 'ministries.view', 'ministries.manage_members', 'events.view', 'events.create', 'reports.view'],
        constitutional_restrictions: ['Subject to Executive Committee policy regarding external partnerships']
      },
      {
        id: 'pos-4',
        code: 'secretary',
        name: 'Secretary',
        category: 'executive',
        description: 'Custodian of records, correspondence, minutes, and membership registers.',
        constitutional_reference: 'Article 12.4',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 4,
        responsibilities: [
          'Maintains accurate registers of certified full members, special members, and associates',
          'Records and preserves comprehensive minutes of all Executive and General meetings',
          'Handles all official correspondence and notices of the Christian Union',
          'Issues certificates of membership and official recommendation letters',
          'Co-signatory for official TUMCU correspondence and constitutional petitions'
        ],
        permissions: ['membership.view_all', 'membership.review', 'membership.approve', 'meetings.view', 'meetings.create', 'meetings.manage_minutes', 'communication.view', 'communication.create', 'reports.view', 'leadership.view'],
        constitutional_restrictions: ['Minutes must be formally confirmed and signed at the next ordinary meeting', 'Cannot alter membership register without approved application or constitutional resolution']
      },
      {
        id: 'pos-5',
        code: 'vice_secretary',
        name: 'Vice Secretary',
        category: 'executive',
        description: 'Hospitality coordinator, guest ministers liaison, and secretarial assistant.',
        constitutional_reference: 'Article 12.5',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 5,
        responsibilities: [
          'Assists the Secretary and records minutes in their absence',
          'Oversees hospitality for guest ministers, external speakers, and visiting teams',
          'Coordinates Catering and Ushering logistics for Sunday services and conferences',
          'Supervises meeting venues arrangement and welcome protocols'
        ],
        permissions: ['meetings.view', 'events.view', 'communication.view', 'reports.view', 'ministries.view'],
        constitutional_restrictions: ['Works under supervision of Secretary and Executive Committee']
      },
      {
        id: 'pos-6',
        code: 'treasurer',
        name: 'Treasurer',
        category: 'executive',
        description: 'Custodian of funds, financial stewardship, receipts, budgets, and accounting.',
        constitutional_reference: 'Article 12.6',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 6,
        responsibilities: [
          'Maintains complete, transparent books of accounts and records all receipts and payments',
          'Issues official TUMCU receipts for all tithes, offerings, donations, and pledges',
          'Prepares annual and semester operational budgets for Executive and AGM approval',
          'Chairs Treasury Committee and prepares financial statements for internal and external audits',
          'Supervises capital project accounts and bank reconciliations'
        ],
        permissions: ['finance.view', 'finance.create', 'finance.receipts', 'finance.budget', 'finance.reports', 'project.manage', 'reports.view'],
        constitutional_restrictions: [
          'Cannot independently authorize restricted withdrawals (Article 15.3)',
          'Withdrawals require Executive/Subcommittee resolution and two authorized signatories',
          'Must present books for audit at least two weeks before Annual General Meeting'
        ]
      },
      {
        id: 'pos-7',
        code: 'prayer_chairperson',
        name: 'Prayer Committee Chairperson',
        category: 'executive',
        description: 'Spiritual intercession, prayer chains, keshas, and morning devotions.',
        constitutional_reference: 'Article 12.7',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 7,
        responsibilities: [
          'Chairs Prayer Committee and guides the spiritual intercessory pulse of TUMCU',
          'Organizes weekly overnight prayer vigils (keshas), fasts, and semester prayer weeks',
          'Coordinates confidential prayer request handling and intercession chains',
          'Mobilizes campus morning devotions and hostel prayer altars'
        ],
        permissions: ['prayer.view', 'prayer.view_confidential', 'prayer.create', 'prayer.edit', 'events.view', 'meetings.view'],
        constitutional_restrictions: ['Confidential prayer requests must not be publicly disclosed without permission']
      },
      {
        id: 'pos-8',
        code: 'worship_chairperson',
        name: 'Worship Committee Chairperson',
        category: 'executive',
        description: 'Liturgical worship, Praise & Worship team, instrumentalists, and music repertoire.',
        constitutional_reference: 'Article 12.8',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 8,
        responsibilities: [
          'Chairs Worship Committee and coordinates liturgical musical excellence',
          'Oversees Praise & Worship Ministry and Instrumentalists Ministry',
          'Schedules song leaders, rehearsals, workshops, and worship nights',
          'Maintains sound balance and spiritual reverence in music selection'
        ],
        permissions: ['ministries.view', 'events.view', 'events.create', 'attendance.view'],
        constitutional_restrictions: ['All song repertoires must align with TUMCU doctrinal basis (Article 4)']
      },
      {
        id: 'pos-9',
        code: 'missions_chairperson',
        name: 'Mission Committee Chairperson',
        category: 'executive',
        description: 'Evangelism field mobilization, annual missions, and community outreaches.',
        constitutional_reference: 'Article 12.9',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 9,
        responsibilities: [
          'Chairs Missions Committee and plans annual mega mission trips and weekend missions',
          'Coordinates evangelism teams, open-air crusades, door-to-door gospel witnessing',
          'Liaises with mission fields, partner churches, and rural ministry stations',
          'Conducts cross-cultural mission training and post-mission follow-ups'
        ],
        permissions: ['events.view', 'events.create', 'ministries.view', 'reports.view'],
        constitutional_restrictions: ['Mission budgets require Executive Committee resolution and Treasurer review']
      },
      {
        id: 'pos-10',
        code: 'discipleship_chairperson',
        name: 'Discipleship Committee Chairperson',
        category: 'executive',
        description: 'Nurturing classes, Bible Study (BEST) groups, new converts, and spiritual mentorship.',
        constitutional_reference: 'Article 12.10',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 10,
        responsibilities: [
          'Chairs Discipleship Committee and designs foundational follow-up for new converts',
          'Coordinates Bible Study (BEST) small groups, facilitators, and study guides',
          'Organizes mentorship cohorts and first-year student spiritual orientation',
          'Maintains discipleship spiritual records and baptism preparation classes'
        ],
        permissions: ['membership.view_all', 'events.view', 'meetings.view', 'reports.view'],
        constitutional_restrictions: ['Doctrinal materials must strictly conform to TUMCU Statement of Faith']
      },
      {
        id: 'pos-11',
        code: 'assets_chairperson',
        name: 'Assets Committee Chairperson',
        category: 'executive',
        description: 'Stewardship, maintenance, inventory, equipment loans, and hardware procurement.',
        constitutional_reference: 'Article 12.11',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 11,
        responsibilities: [
          'Chairs Assets Committee and oversees all union hardware, sound gear, instruments, and furniture',
          'Maintains updated asset register, tagging, serial numbers, and condition reports',
          'Controls equipment borrowing, loan agreements, and return inspections',
          'Coordinates routine maintenance, servicing, repair, and safe storage'
        ],
        permissions: ['assets.view', 'assets.manage', 'reports.view', 'events.view'],
        constitutional_restrictions: ['Disposal or acquisition of capital assets requires Executive Committee sanction']
      },
      {
        id: 'pos-12',
        code: 'publicity_chairperson',
        name: 'Publicity Committee Chairperson',
        category: 'executive',
        description: 'Announcements, website, social media, posters, photography, and livestreams.',
        constitutional_reference: 'Article 12.12',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 12,
        responsibilities: [
          'Chairs Publicity Committee and coordinates campus branding and communication',
          'Oversees Media Ministry, livestream broadcasts, and digital content',
          'Designs official event posters, digital flyers, bulletin publications, and website updates',
          'Publishes authorized announcements across university platforms and halls of residence'
        ],
        permissions: ['communication.view', 'communication.create', 'communication.edit', 'events.view', 'ministries.view'],
        constitutional_restrictions: ['Public publications must reflect Christian decorum and Executive endorsement']
      },
      {
        id: 'pos-13',
        code: 'non_residents_chairperson',
        name: 'Non-Residents Committee Chairperson',
        category: 'executive',
        description: 'Off-campus student fellowship, non-resident welfare, and neighborhood cell groups.',
        constitutional_reference: 'Article 12.13',
        is_executive: true,
        requires_gender_rule: false,
        active: true,
        display_order: 13,
        responsibilities: [
          'Chairs Non-Residents Committee and champions welfare of off-campus students',
          'Organizes neighborhood Bible study cells, hostel fellowships, and outreach',
          'Coordinates night travel logistics and transport security during keshas and late services',
          'Advocates for non-resident representation and integration in all CU programs'
        ],
        permissions: ['welfare.view', 'events.view', 'meetings.view', 'reports.view'],
        constitutional_restrictions: ['Must maintain active liaison with University Dean of Students for off-campus welfare']
      },
      {
        id: 'pos-14',
        code: 'welfare_chairperson',
        name: 'Welfare Committee Chairperson',
        category: 'committee',
        description: 'Benevolent support, student emergency funds, bereavement care, and hospital visits.',
        constitutional_reference: 'Article 13.1',
        is_executive: false,
        requires_gender_rule: false,
        active: true,
        display_order: 14,
        responsibilities: [
          'Chairs Welfare Committee and processes confidential student benevolent requests',
          'Coordinates meal assistance, emergency hospital welfare, and funeral condolences',
          'Maintains transparent records of welfare allocations under 1st Vice Chairperson supervision'
        ],
        permissions: ['welfare.view', 'welfare.approve', 'reports.view'],
        constitutional_restrictions: ['Welfare disbursements are strictly governed by approved benevolence ceilings']
      },
      {
        id: 'pos-15',
        code: 'media_ministry_leader',
        name: 'Media Ministry Leader',
        category: 'ministry',
        description: 'Audio-visual production, livestream operations, equipment management, and team schedule.',
        constitutional_reference: 'Article 16.1',
        is_executive: false,
        requires_gender_rule: false,
        active: true,
        display_order: 15,
        responsibilities: [
          'Leads Media Ministry operations: Sunday livestreams, video recording, photography',
          'Schedules camera operators, sound technicians, and projectionists for all services',
          'Maintains media equipment inventory, digital library assets, and archives',
          'Conducts technical skills training workshops for ministry apprentices'
        ],
        permissions: ['ministries.view', 'ministries.manage_members', 'communication.create', 'assets.view'],
        constitutional_restrictions: ['Works under guidance of Publicity Committee Chairperson']
      }
    ],
    ministries: [
      { id: 'min-1', code: 'intercessory', name: 'Intercessory Ministry', description: 'Dedicated to prayer, fasting, and spiritual intercession for the CU and campus.', meeting_day: 'Wednesdays & Fridays', meeting_venue: 'Main Chapel', image_url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-2', code: 'worship', name: 'Praise & Worship Ministry', description: 'Leading the congregation into the manifest presence of God through spirit-filled worship.', meeting_day: 'Tuesdays & Thursdays', meeting_venue: 'Assembly Hall', image_url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-3', code: 'instrumentalists', name: 'Instrumentalists Ministry', description: 'Skillfully ministering with musical instruments to support worship services.', meeting_day: 'Tuesdays & Saturdays', meeting_venue: 'Music Room', image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-4', code: 'ushering', name: 'Ushering Ministry', description: 'Welcoming believers, maintaining order, and fostering hospitality in all gatherings.', meeting_day: 'Thursdays', meeting_venue: 'Chapel Foyer', image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-5', code: 'catering', name: 'Catering Ministry', description: 'Managing hospitality, food, and refreshments during CU events, AGMs, and conferences.', meeting_day: 'Saturdays before events', meeting_venue: 'Dining Hall Kitchen', image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-6', code: 'media', name: 'Media Ministry', description: 'Audio-visual production, livestreaming, photography, and digital ministry outreach.', meeting_day: 'Fridays', meeting_venue: 'Media Studio', image_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-7', code: 'creative', name: 'Creative Ministry', description: 'Proclaiming the Gospel through Christian drama, poetry, spoken word, and dance.', meeting_day: 'Mondays & Wednesdays', meeting_venue: 'Amphitheatre', image_url: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-8', code: 'technicians', name: 'Technicians Ministry', description: 'Sound engineering, electrical setup, lighting, and stage technical management.', meeting_day: 'Saturdays', meeting_venue: 'Control Booth', image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-9', code: 'high_school', name: 'High School Ministry', description: 'Evangelism, mentorship, and discipleship missions to secondary schools in Mombasa.', meeting_day: 'Sundays', meeting_venue: 'Room B10', image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-10', code: 'hospital', name: 'Hospital Ministry', description: 'Visiting patients in Coast General and local clinics with prayers and care packages.', meeting_day: 'Saturdays', meeting_venue: 'Hospital Gate', image_url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-11', code: 'brothers', name: "Brothers' Ministry", description: 'Building godly men through fellowship, accountability, and leadership development.', meeting_day: 'Alternate Fridays', meeting_venue: 'Hostel Courtyard', image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
      { id: 'min-12', code: 'sisters', name: "Sisters' Ministry", description: 'Nurturing virtuous women of faith, character, and spiritual excellence.', meeting_day: 'Alternate Fridays', meeting_venue: 'Chapel Hall', image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80', created_at: new Date().toISOString() },
    ],
    committees: [
      { id: 'com-1', code: 'prayer', name: 'Prayer Committee', description: 'Oversees campus prayer networks, weekly night vigils, and prayer weeks.', created_at: new Date().toISOString() },
      { id: 'com-2', code: 'worship', name: 'Worship Committee', description: 'Coordinates musical equipment, music repertoire, and liturgical coordination.', created_at: new Date().toISOString() },
      { id: 'com-3', code: 'missions', name: 'Missions Committee', description: 'Plans annual mission trips, weekend outreaches, and evangelism campaigns.', created_at: new Date().toISOString() },
      { id: 'com-4', code: 'discipleship', name: 'Discipleship Committee', description: 'Runs new believer classes, Bible study groups (BEST), and one-on-one mentorship.', created_at: new Date().toISOString() },
      { id: 'com-5', code: 'assets', name: 'Assets Committee', description: 'Inventories, maintains, and procures Christian Union sound gear and properties.', created_at: new Date().toISOString() },
      { id: 'com-6', code: 'hospitality', name: 'Hospitality Committee', description: 'Takes care of guest ministers, first-time visitors, and welfare needs.', created_at: new Date().toISOString() },
      { id: 'com-7', code: 'publicity', name: 'Publicity Committee', description: 'Designs posters, manages social media, announcements, and campus branding.', created_at: new Date().toISOString() },
      { id: 'com-8', code: 'treasury', name: 'Treasury Committee', description: 'Ensures stewardship, transparent accounting, auditing, and financial reporting.', created_at: new Date().toISOString() },
      { id: 'com-9', code: 'non_residents', name: 'Non-Residents Committee', description: 'Caters to fellowship and welfare for students living in outside-campus hostels.', created_at: new Date().toISOString() },
      { id: 'com-10', code: 'welfare', name: 'Welfare Committee', description: 'Supports needy brethren through benevolent funds, meals, and emergencies.', created_at: new Date().toISOString() },
    ],
    roles: [
      { id: 'role-1', code: 'super_admin', name: 'Super Administrator', category: 'system_admin', is_system_role: 1 },
      { id: 'role-2', code: 'system_admin', name: 'System Administrator', category: 'system_admin', is_system_role: 1 },
      { id: 'role-3', code: 'chairperson', name: 'Chairperson', category: 'constitutional_leadership', is_system_role: 0 },
      { id: 'role-4', code: 'first_vice_chairperson', name: '1st Vice Chairperson', category: 'constitutional_leadership', is_system_role: 0 },
      { id: 'role-5', code: 'second_vice_chairperson', name: '2nd Vice Chairperson', category: 'constitutional_leadership', is_system_role: 0 },
      { id: 'role-6', code: 'secretary', name: 'Secretary', category: 'constitutional_leadership', is_system_role: 0 },
      { id: 'role-7', code: 'treasurer', name: 'Treasurer', category: 'constitutional_leadership', is_system_role: 0 },
      { id: 'role-8', code: 'prayer_chairperson', name: 'Prayer Committee Chairperson', category: 'committee', is_system_role: 0 },
      { id: 'role-9', code: 'ministry_leader', name: 'Ministry Leader', category: 'ministry', is_system_role: 0 },
      { id: 'role-10', code: 'member', name: 'Member', category: 'member', is_system_role: 0 },
      { id: 'role-11', code: 'librarian', name: 'Librarian & Resource Custodian', category: 'stewardship', is_system_role: 0 },
      { id: 'role-12', code: 'e_team_chairperson', name: 'E-Team Chairperson', category: 'committee', is_system_role: 0 },
      { id: 'role-13', code: 'legacy_e_team_chairperson', name: 'Legacy E-Team Chairperson', category: 'committee', is_system_role: 0 },
      { id: 'role-14', code: 'media_leader', name: 'Media Ministry Leader', category: 'ministry', is_system_role: 0 },
    ],
    permissions: [
      { id: 'perm-1', code: 'membership.view_all', module: 'membership' },
      { id: 'perm-2', code: 'membership.review', module: 'membership' },
      { id: 'perm-3', code: 'membership.approve', module: 'membership' },
      { id: 'perm-4', code: 'finance.view', module: 'finance' },
      { id: 'perm-5', code: 'finance.request', module: 'finance' },
      { id: 'perm-6', code: 'finance.approve', module: 'finance' },
      { id: 'perm-7', code: 'meetings.view', module: 'meetings' },
      { id: 'perm-8', code: 'meetings.create', module: 'meetings' },
      { id: 'perm-9', code: 'attendance.view', module: 'attendance' },
      { id: 'perm-10', code: 'attendance.record', module: 'attendance' },
      { id: 'perm-22', code: 'attendance.export', module: 'attendance' },
      { id: 'perm-23', code: 'attendance.manage_sessions', module: 'attendance' },
      { id: 'perm-11', code: 'events.view', module: 'events' },
      { id: 'perm-12', code: 'events.create', module: 'events' },
      { id: 'perm-24', code: 'events.edit', module: 'events' },
      { id: 'perm-25', code: 'events.delete', module: 'events' },
      { id: 'perm-26', code: 'events.approve', module: 'events' },
      { id: 'perm-13', code: 'ministries.view', module: 'ministries' },
      { id: 'perm-27', code: 'ministries.create', module: 'ministries' },
      { id: 'perm-28', code: 'ministries.edit', module: 'ministries' },
      { id: 'perm-29', code: 'ministries.delete', module: 'ministries' },
      { id: 'perm-30', code: 'ministries.manage_members', module: 'ministries' },
      { id: 'perm-14', code: 'committees.view', module: 'committees' },
      { id: 'perm-15', code: 'leadership.view', module: 'leadership' },
      { id: 'perm-16', code: 'leadership.assign', module: 'leadership' },
      { id: 'perm-17', code: 'prayer.view', module: 'prayer' },
      { id: 'perm-18', code: 'prayer.create', module: 'prayer' },
      { id: 'perm-19', code: 'prayer.view_confidential', module: 'prayer' },
      { id: 'perm-20', code: 'system.manage_roles', module: 'system' },
      { id: 'perm-21', code: 'system.manage_permissions', module: 'system' },
      { id: 'perm-31', code: 'communication.view', module: 'communication' },
      { id: 'perm-32', code: 'communication.create', module: 'communication' },
      { id: 'perm-33', code: 'communication.edit', module: 'communication' },
      { id: 'perm-34', code: 'communication.delete', module: 'communication' },
      { id: 'perm-35', code: 'elections.view', module: 'elections' },
      { id: 'perm-36', code: 'elections.vote', module: 'elections' },
      { id: 'perm-37', code: 'elections.manage', module: 'elections' },
      { id: 'perm-38', code: 'elections.audit', module: 'elections' },
      { id: 'perm-39', code: 'welfare.view', module: 'welfare' },
      { id: 'perm-40', code: 'welfare.create', module: 'welfare' },
      { id: 'perm-41', code: 'welfare.edit', module: 'welfare' },
      { id: 'perm-42', code: 'welfare.approve', module: 'welfare' },
      { id: 'perm-43', code: 'reports.view', module: 'reports' },
      { id: 'perm-44', code: 'reports.create', module: 'reports' },
      { id: 'perm-45', code: 'associates.view', module: 'associates' },
      { id: 'perm-46', code: 'associates.manage', module: 'associates' },
      { id: 'perm-47', code: 'assets.view', module: 'assets' },
      { id: 'perm-48', code: 'assets.manage', module: 'assets' },
      { id: 'perm-49', code: 'meetings.manage_minutes', module: 'meetings' },
      { id: 'perm-50', code: 'meetings.approve_minutes', module: 'meetings' },
      { id: 'perm-51', code: 'audit.view', module: 'system' },
      { id: 'perm-52', code: 'system.health', module: 'system' },
      { id: 'perm-53', code: 'system.settings', module: 'system' },
      // Library permissions
      { id: 'perm-54', code: 'library.view', module: 'library' },
      { id: 'perm-55', code: 'library.request', module: 'library' },
      { id: 'perm-56', code: 'library.create', module: 'library' },
      { id: 'perm-57', code: 'library.edit', module: 'library' },
      { id: 'perm-58', code: 'library.delete', module: 'library' },
      { id: 'perm-59', code: 'library.manage_inventory', module: 'library' },
      { id: 'perm-60', code: 'library.manage_requests', module: 'library' },
      { id: 'perm-61', code: 'library.checkout', module: 'library' },
      { id: 'perm-62', code: 'library.return', module: 'library' },
      { id: 'perm-63', code: 'library.view_reports', module: 'library' },
      // Member gallery permissions
      { id: 'perm-64', code: 'gallery.view', module: 'gallery' },
      { id: 'perm-65', code: 'gallery.create', module: 'gallery' },
      { id: 'perm-66', code: 'gallery.edit', module: 'gallery' },
      { id: 'perm-67', code: 'gallery.delete', module: 'gallery' },
      { id: 'perm-68', code: 'gallery.publish', module: 'gallery' },
      // Landing & Ministry Media permissions
      { id: 'perm-69', code: 'media.manage_landing', module: 'media' },
      { id: 'perm-70', code: 'media.manage_ministries', module: 'media' },
      // E-Teams permissions
      { id: 'perm-71', code: 'eteams.view', module: 'eteams' },
      { id: 'perm-72', code: 'eteams.manage_team', module: 'eteams' },
      { id: 'perm-73', code: 'eteams.manage_programmes', module: 'eteams' },
      { id: 'perm-74', code: 'eteams.manage_gallery', module: 'eteams' },
      { id: 'perm-75', code: 'eteams.manage_reports', module: 'eteams' },
      { id: 'perm-76', code: 'eteams.manage_announcements', module: 'eteams' },
      // Programmes
      { id: 'perm-77', code: 'programmes.view', module: 'programmes' },
      { id: 'perm-78', code: 'programmes.manage', module: 'programmes' },
    ],
    role_permissions: [],
    users: [
      {
        id: 'usr-meshack-1',
        username: 'meshack',
        email: 'meshackokoth436@gmail.com',
        phone_number: '+254700000436',
        password_hash: bcrypt.hashSync(uuidv4(), 10),
        full_name: 'Meshack Okoth (Super Administrator)',
        gender: 'male',
        admission_number: 'ADM/2026/000',
        school: 'School of Computing and Informatics',
        course: 'BSc. Computer Science',
        year_of_study: 4,
        account_status: 'active',
        created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
      {
        id: 'usr-admin-1',
        username: 'admin',
        email: 'admin@tumcu.ac.ke',
        phone_number: '+254700000001',
        password_hash: bcrypt.hashSync(uuidv4(), 10),
        full_name: 'TUMCU Super Administrator',
        gender: 'male',
        admission_number: 'ADM/2026/001',
        school: 'School of Computing and Informatics',
        course: 'BSc. Computer Science',
        year_of_study: 4,
        account_status: 'active',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      // Active Registered Members
      {
        id: 'usr-member-1',
        username: 'samuel.baraza',
        email: 'samuel.baraza@tum.ac.ke',
        phone_number: '+254701234567',
        password_hash: bcrypt.hashSync(uuidv4(), 10),
        full_name: 'Samuel Baraza',
        gender: 'male',
        admission_number: 'ADM/2023/0112',
        school: 'School of Engineering and Technology',
        course: 'BSc. Mechanical Engineering',
        year_of_study: 4,
        account_status: 'active',
        created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
      },
      {
        id: 'usr-member-2',
        username: 'esther.chebet',
        email: 'esther.chebet@tum.ac.ke',
        phone_number: '+254702345678',
        password_hash: bcrypt.hashSync(uuidv4(), 10),
        full_name: 'Esther Chebet',
        gender: 'female',
        admission_number: 'ADM/2024/0331',
        school: 'School of Applied and Health Sciences',
        course: 'BSc. Nursing',
        year_of_study: 3,
        account_status: 'active',
        created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
      },
      {
        id: 'usr-member-3',
        username: 'peter.omondi',
        email: 'peter.omondi@tum.ac.ke',
        phone_number: '+254703456789',
        password_hash: bcrypt.hashSync(uuidv4(), 10),
        full_name: 'Peter Omondi',
        gender: 'male',
        admission_number: 'ADM/2024/0789',
        school: 'School of Business',
        course: 'BBA Marketing',
        year_of_study: 3,
        account_status: 'active',
        created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
      },
      {
        id: 'usr-member-4',
        username: 'grace.nyambura',
        email: 'grace.nyambura@tum.ac.ke',
        phone_number: '+254704567890',
        password_hash: bcrypt.hashSync(uuidv4(), 10),
        full_name: 'Grace Nyambura',
        gender: 'female',
        admission_number: 'ADM/2025/0456',
        school: 'School of Computing and Informatics',
        course: 'BSc. Computer Science',
        year_of_study: 2,
        account_status: 'active',
        created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      },
      // Student Applicants awaiting review
      {
        id: 'usr-applicant-1',
        username: 'john.kamau',
        email: 'john.kamau@tum.ac.ke',
        phone_number: '+254711223344',
        password_hash: bcrypt.hashSync(uuidv4(), 10),
        full_name: 'John Mwangi Kamau',
        gender: 'male',
        admission_number: 'ADM/2025/1142',
        school: 'School of Computing and Informatics',
        course: 'BSc. Information Technology',
        year_of_study: 2,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'usr-applicant-2',
        username: 'mercy.atieno',
        email: 'mercy.atieno@tum.ac.ke',
        phone_number: '+254722334455',
        password_hash: bcrypt.hashSync(uuidv4(), 10),
        full_name: 'Mercy Atieno Ochieng',
        gender: 'female',
        admission_number: 'ADM/2026/0891',
        school: 'School of Applied and Health Sciences',
        course: 'BSc. Medical Laboratory Science',
        year_of_study: 1,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'usr-applicant-3',
        username: 'brian.kiprono',
        email: 'brian.kiprono@tum.ac.ke',
        phone_number: '+254733445566',
        password_hash: bcrypt.hashSync(uuidv4(), 10),
        full_name: 'Brian Kiprono Cheruiyot',
        gender: 'male',
        admission_number: 'ADM/2024/0523',
        school: 'School of Engineering and Technology',
        course: 'BSc. Civil Engineering',
        year_of_study: 3,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'usr-applicant-4',
        username: 'faith.wanjiku',
        email: 'faith.wanjiku@tum.ac.ke',
        phone_number: '+254744556677',
        password_hash: bcrypt.hashSync(uuidv4(), 10),
        full_name: 'Faith Wanjiku Mwangi',
        gender: 'female',
        admission_number: 'ADM/2025/2204',
        school: 'School of Business',
        course: 'BCom Finance',
        year_of_study: 2,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
      },
      {
        id: 'usr-applicant-5',
        username: 'david.mutua',
        email: 'david.mutua@tum.ac.ke',
        phone_number: '+254755667788',
        password_hash: bcrypt.hashSync(uuidv4(), 10),
        full_name: 'David Mutua Musyoka',
        gender: 'male',
        admission_number: 'ADM/2026/1410',
        school: 'School of Engineering and Technology',
        course: 'BSc. Electrical and Electronics Engineering',
        year_of_study: 1,
        account_status: 'pending_approval',
        created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      },
    ],
    leadership_assignments: [],
    custom_committees: [],
    finance_resolutions: [],
    user_roles: [
      { id: 'ur-meshack-1', user_id: 'usr-meshack-1', role_id: 'role-1', scope_type: null, scope_id: null },
      { id: 'ur-1', user_id: 'usr-admin-1', role_id: 'role-1', scope_type: null, scope_id: null },
      { id: 'ur-m-1', user_id: 'usr-member-1', role_id: 'role-10', scope_type: null, scope_id: null },
      { id: 'ur-m-2', user_id: 'usr-member-2', role_id: 'role-10', scope_type: null, scope_id: null },
      { id: 'ur-m-3', user_id: 'usr-member-3', role_id: 'role-10', scope_type: null, scope_id: null },
      { id: 'ur-m-4', user_id: 'usr-member-4', role_id: 'role-10', scope_type: null, scope_id: null },
    ],
    weekly_programmes: [
      {
        id: 'prog-mon',
        day: 'Monday',
        title: 'Door to Door & E-Teams Fellowship',
        programme_type: 'evangelism',
        time: '5:00 PM – 7:00 PM',
        venue: 'Assembly Grounds & Designated Centers',
        leader: 'Evangelism & E-Teams Committee',
        description: 'Alternating weekly evangelism: E-Teams Fellowship one Monday, Door to Door Evangelism the next Monday.',
        alternating_enabled: 1,
        interval_type: 'biweekly',
        alternate_a_title: 'E-Teams Fellowship',
        alternate_b_title: 'Door to Door Evangelism',
        anchor_monday: '2026-09-21',
        anchor_programme: 'alternate_a',
      },
      {
        id: 'prog-tue',
        day: 'Tuesday',
        title: 'Bible Study (BEST)',
        programme_type: 'bible_study',
        time: '5:00 PM – 7:00 PM',
        venue: 'Lecture Theatres & Designated Classes',
        leader: 'Bible Study Ministry',
        description: 'Systematic verse-by-verse scripture study, discipleship cohorts, and small group discussions.',
        alternating_enabled: 0,
      },
      {
        id: 'prog-wed',
        day: 'Wednesday',
        title: 'Discipleship Class',
        programme_type: 'discipleship',
        time: '5:00 PM – 7:00 PM',
        venue: 'Main Sanctuary / Assembly Hall',
        leader: 'Discipleship Ministry',
        description: 'Foundational Christian doctrine and spiritual growth mentorship for disciples.',
        alternating_enabled: 0,
      },
      {
        id: 'prog-thu',
        day: 'Thursday',
        title: 'Empowerment Service',
        programme_type: 'empowerment',
        time: '5:00 PM – 7:00 PM',
        venue: 'Main Sanctuary / Assembly Hall',
        leader: 'Empowerment Ministry',
        description: 'Spiritual, academic, leadership, and career empowerment for campus believers.',
        alternating_enabled: 0,
      },
      {
        id: 'prog-fri',
        day: 'Friday',
        title: 'Friday Main Service',
        programme_type: 'fellowship',
        time: '6:00 PM – 8:30 PM',
        venue: 'Assembly Hall',
        leader: 'Executive Committee & Music Ministry',
        description: 'Dynamic campus fellowship, deep worship, testimonies, and practical scriptural preaching.',
        alternating_enabled: 0,
      },
      {
        id: 'prog-sun',
        day: 'Sunday',
        title: 'Sunday Service',
        programme_type: 'service',
        time: '8:00 AM – 12:30 PM',
        venue: 'Main Assembly Hall / Sanctuary',
        leader: 'Executive Committee',
        description: 'Sunday morning corporate worship, celebration, Word, and communion.',
        alternating_enabled: 0,
        is_configurable: 1,
      },
    ],
    events: [
      // --- Friday Services (6:00 PM – 8:30 PM) ---
      {
        id: 'evt-fri-1',
        title: 'Friday Service: Knowing Who You Are in Christ',
        event_type: 'service',
        description: 'Foundational fellowship service opening the semester spiritual theme: Manifesting the Light of Christ.',
        start_at: '2026-09-04T18:00:00Z',
        end_at: '2026-09-04T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Meshack / TUMCU Patron',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-2',
        title: 'Friday Service: The Power of a Consecrated Life',
        event_type: 'service',
        description: 'Exhortation on personal purity, devotion, and living a dedicated life on campus.',
        start_at: '2026-09-11T18:00:00Z',
        end_at: '2026-09-11T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Pst. Otieno',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-3',
        title: 'Friday Service: Overcoming Iniquities & Walking in Victory',
        event_type: 'service',
        description: 'Overcoming trials, temptation, and walking in the fullness of Christ victory.',
        start_at: '2026-09-18T18:00:00Z',
        end_at: '2026-09-18T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Rev. Barasa',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-4',
        title: 'Friday Service: Walking as Children of Light',
        event_type: 'service',
        description: 'Living out Matthew 5:16 as shining beacons in lecture halls, hostels, and student associations.',
        start_at: '2026-09-25T18:00:00Z',
        end_at: '2026-09-25T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Bro. Caleb (CU Chairperson)',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-5',
        title: 'Friday Service: The Cost and Joy of Discipleship',
        event_type: 'service',
        description: 'Exploring biblical discipleship and the cost of bearing one cross with joy.',
        start_at: '2026-10-02T18:00:00Z',
        end_at: '2026-10-02T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Pst. Mwangi',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-6',
        title: 'Friday Service: Standing Firm in Campus Culture',
        event_type: 'service',
        description: 'Navigating peer pressure, academic stress, and modern campus culture with biblical conviction.',
        start_at: '2026-10-09T18:00:00Z',
        end_at: '2026-10-09T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Sis. Faith (Secretary)',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-7',
        title: 'Friday Service: The Armor of God & Spiritual Warfare',
        event_type: 'service',
        description: 'Deep exposition of Ephesians 6 and prevailing in faith through corporate spiritual armor.',
        start_at: '2026-10-16T18:00:00Z',
        end_at: '2026-10-16T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Ev. David (1st Vice Chairperson)',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-8',
        title: 'Friday Service: Power of Corporate Prayer & Fasting',
        event_type: 'service',
        description: 'Igniting collective prayer altars across campus and hostels.',
        start_at: '2026-10-23T18:00:00Z',
        end_at: '2026-10-23T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Pst. Steve (2nd Vice Chairperson)',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-9',
        title: 'Friday Service: Kingdom Stewardship & Faithfulness',
        event_type: 'service',
        description: 'Managing time, gifts, career callings, and resources for the glory of God.',
        start_at: '2026-10-30T18:00:00Z',
        end_at: '2026-10-30T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Bro. Meshack (Treasurer)',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-10',
        title: 'Friday Service: Living on Mission — Reaching the Lost',
        event_type: 'service',
        description: 'Evangelism focus, sharing the gospel with boldness across university faculties and Coast region.',
        start_at: '2026-11-06T18:00:00Z',
        end_at: '2026-11-06T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Pst. Ochieng',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-11',
        title: 'Friday Service: Abiding in the Vine',
        event_type: 'service',
        description: 'John 15 reflection on remaining in Christ for enduring fruitfulness.',
        start_at: '2026-11-13T18:00:00Z',
        end_at: '2026-11-13T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Rev. Mutua',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-12',
        title: 'Friday Service: Grace Sufficient for Every Trial',
        event_type: 'service',
        description: 'Comfort, resilience, and supernatural strength as examination season draws near.',
        start_at: '2026-11-20T18:00:00Z',
        end_at: '2026-11-20T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Pst. Kemboi',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-13',
        title: 'Friday Service: Finishing the Race with Joy',
        event_type: 'service',
        description: 'Concluding teachings for the semester with celebration, awards, and encouragement.',
        start_at: '2026-11-27T18:00:00Z',
        end_at: '2026-11-27T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Patron & Executive Committee',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-fri-14',
        title: 'Friday Service: The Eternal Light — Hope of Glory',
        event_type: 'service',
        description: 'Semester wrap-up worship night and thanksgiving fellowship.',
        start_at: '2026-12-04T18:00:00Z',
        end_at: '2026-12-04T20:30:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'CU Elders & Pastoral Board',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },

      // --- Sunday Services (8:00 AM – 12:30 PM) ---
      {
        id: 'evt-sun-1',
        title: 'Orientation & Welcome Sunday: You Are the Light',
        event_type: 'service',
        description: 'Welcoming first years, returning students, and dedicating the academic and spiritual year.',
        start_at: '2026-09-06T08:00:00Z',
        end_at: '2026-09-06T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'Patron & Executive',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-2',
        title: 'Commitment & Commissioning Sunday',
        event_type: 'service',
        description: 'Signing the doctrinal basis, constitutional pledge, and dedicating ministry teams.',
        start_at: '2026-09-13T08:00:00Z',
        end_at: '2026-09-13T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'CU Patron',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-3',
        title: 'Ministry Sunday: Presentations & Enrolment',
        event_type: 'service',
        description: 'Praise & Worship, Ushering, Media, Instrumentalists, and Discipleship ministry showcase.',
        start_at: '2026-09-20T08:00:00Z',
        end_at: '2026-09-20T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'Ministry Leaders Council',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-4',
        title: 'Old School Sunday: Heritage of Faith',
        event_type: 'service',
        description: 'Celebrating the historical roots of TUM Christian Union with classic hymns and attire.',
        start_at: '2026-09-27T08:00:00Z',
        end_at: '2026-09-27T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'Senior Alumni Minister',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-5',
        title: 'Staff & Faculty Appreciation Sunday',
        event_type: 'service',
        description: 'Honoring university Christian staff, faculty mentors, and campus leadership.',
        start_at: '2026-10-04T08:00:00Z',
        end_at: '2026-10-04T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'Christian Faculty Dean',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-6',
        title: 'Mission Follow-Up Sunday',
        event_type: 'service',
        description: 'Testimonies, convert follow-up, and report from evangelistic outreaches.',
        start_at: '2026-10-11T08:00:00Z',
        end_at: '2026-10-11T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'Mission Director',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-7',
        title: 'E-Teams Sunday: NET MINISTRIES TRUST TUM UNIT & NORET-SORET Commissioning',
        event_type: 'service',
        description: 'Evangelism teams regional showcase, commissioning, and prayer for community outreach.',
        start_at: '2026-10-18T08:00:00Z',
        end_at: '2026-10-18T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'NET MINISTRIES TRUST TUM UNIT & NORET-SORET Chairpersons',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-8',
        title: 'Welfare Sunday: Bearing One Another Burdens',
        event_type: 'service',
        description: 'Special love offering, compassionate support for needy students, and fellowship meal.',
        start_at: '2026-10-25T08:00:00Z',
        end_at: '2026-10-25T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'Welfare Committee Head',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-9',
        title: 'Word Explosion Sunday: Spiritual Awakening',
        event_type: 'service',
        description: 'Climax of the Word Explosion weekend conference with powerful keynote preaching.',
        start_at: '2026-11-01T08:00:00Z',
        end_at: '2026-11-01T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'Guest Speaker',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-10',
        title: 'Associates Sunday & Weekend',
        event_type: 'service',
        description: 'Welcoming graduated TUMCU alumni and associates for mentorship, networking, and support.',
        start_at: '2026-11-08T08:00:00Z',
        end_at: '2026-11-08T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'FOCUS Kenya Associate',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-11',
        title: 'Brothers & Sisters Day Sunday',
        event_type: 'service',
        description: 'Joint fellowship celebrating godly brotherhood and sisterhood in purity and honour.',
        start_at: '2026-11-15T08:00:00Z',
        end_at: '2026-11-15T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'Family Life Minister',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-12',
        title: 'Finalists Dedication & Commissioning Sunday',
        event_type: 'service',
        description: 'Anointing and blessing graduating students as they enter the marketplace and ministry.',
        start_at: '2026-11-22T08:00:00Z',
        end_at: '2026-11-22T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'TUMCU Patron',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-13',
        title: 'Christmas Carols & Worship Extravaganza',
        event_type: 'service',
        description: 'Joyful seasonal worship celebrating the birth of Jesus Christ with choir and instruments.',
        start_at: '2026-11-29T08:00:00Z',
        end_at: '2026-11-29T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'Music & Creative Ministry',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-sun-14',
        title: 'Semester Thanksgiving & Transition Service',
        event_type: 'service',
        description: 'Corporate thanksgiving service testifying of God goodness and preservation all semester.',
        start_at: '2026-12-06T08:00:00Z',
        end_at: '2026-12-06T12:30:00Z',
        location: 'Main Sanctuary / Assembly Hall',
        venue: 'Main Sanctuary / Assembly Hall',
        preacher: 'Executive Leadership',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },

      // --- Special Events & Conferences ---
      {
        id: 'evt-spec-1',
        title: 'Beach Retreat & Fellowship',
        event_type: 'retreat',
        description: 'Bonding, team building, praise, and prayer on the scenic Mombasa coast.',
        start_at: '2026-09-19T08:30:00Z',
        end_at: '2026-09-19T17:00:00Z',
        location: 'Nyali Beach / Waterfront Grounds',
        venue: 'Nyali Beach / Waterfront Grounds',
        preacher: 'Executive Committee',
        is_published: 1,
        requires_registration: 1,
        status: 'published',
      },
      {
        id: 'evt-spec-2',
        title: 'Evangelistic Week: Coast Campus Impact',
        event_type: 'mission',
        description: 'Campus-wide evangelistic campaign, lunch hour preaching, and hostel gospel visitation.',
        start_at: '2026-09-28T09:00:00Z',
        end_at: '2026-10-02T18:00:00Z',
        location: 'TUM Main Campus & Hostels',
        venue: 'TUM Main Campus & Hostels',
        preacher: 'Mission Team & Ev. David',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-spec-3',
        title: 'Night of Encounter — Prayer Kesha',
        event_type: 'service',
        description: 'All-night prayer vigil, spiritual revival, repentance, and intercession.',
        start_at: '2026-10-16T22:00:00Z',
        end_at: '2026-10-17T05:00:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Prayer Committee & Invited Intercessors',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-spec-4',
        title: 'Leaders Training & Ministry Impartation Workshop',
        event_type: 'meeting',
        description: 'Equipping subcommittee members, bible study leaders, and ministry stewards in servant leadership.',
        start_at: '2026-10-24T09:00:00Z',
        end_at: '2026-10-24T15:00:00Z',
        location: 'Science Complex Hall 2',
        venue: 'Science Complex Hall 2',
        preacher: 'FOCUS Kenya Staff & Elders',
        is_published: 1,
        requires_registration: 1,
        status: 'published',
      },
      {
        id: 'evt-spec-5',
        title: 'Regional Campus Christian Union Kesha',
        event_type: 'service',
        description: 'Joint inter-university kesha uniting Christian unions across Mombasa and coastal universities.',
        start_at: '2026-11-06T22:00:00Z',
        end_at: '2026-11-07T05:00:00Z',
        location: 'Main Assembly Hall',
        venue: 'Main Assembly Hall',
        preacher: 'Regional FOCUS Representatives',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
      {
        id: 'evt-spec-6',
        title: 'Word Explosion Conference: Manifesting His Light',
        event_type: 'fellowship',
        description: 'Three days of transformative scripture exposition, seminar tracks, and worship.',
        start_at: '2026-11-13T16:00:00Z',
        end_at: '2026-11-15T18:00:00Z',
        location: 'Assembly Hall',
        venue: 'Assembly Hall',
        preacher: 'Keynote Speakers & Ministers',
        is_published: 1,
        requires_registration: 1,
        status: 'published',
      },
      {
        id: 'evt-spec-7',
        title: 'I-Purpose Youth & Career Summit',
        event_type: 'fellowship',
        description: 'Discovering divine calling, career excellence, innovation, and leadership in the marketplace.',
        start_at: '2026-11-21T09:00:00Z',
        end_at: '2026-11-21T16:00:00Z',
        location: 'University Conference Centre',
        venue: 'University Conference Centre',
        preacher: 'Industry Leaders & Christian Professionals',
        is_published: 1,
        requires_registration: 1,
        status: 'published',
      },
      {
        id: 'evt-spec-8',
        title: 'Annual General Meeting (AGM) & Leadership Transition',
        event_type: 'meeting',
        description: 'Constitutional AGM, presentation of annual reports, audited financial accounts, and elections transition.',
        start_at: '2026-11-28T14:00:00Z',
        end_at: '2026-11-28T18:00:00Z',
        location: 'Main Assembly Hall',
        venue: 'Main Assembly Hall',
        preacher: 'Executive Committee & Electoral Commission',
        is_published: 1,
        requires_registration: 0,
        status: 'published',
      },
    ],
    meetings: [],
    prayer_requests: [],
    spiritual_years: [
      { id: 'sy-2026', name: '2025/2026 Spiritual Year', start_date: '2025-09-01', end_date: '2026-08-31', is_current: true },
    ],
    membership_declarations: [
      { id: 'decl-1', version: '2024.1', title: 'TUMCU Doctrinal Basis & Constitutional Declaration', content: 'In joining Technical University of Mombasa Christian Union, (T.U.M.C.U.), I declare Jesus Christ as my Lord and Savior and it is my desire, by the grace of God, to live a life worthy of my Christian calling. I am also determined to follow the Constitution and support the C.U as it seeks to fulfill its aims.', is_active: true },
    ],
    memberships: [
      {
        id: 'mem-1',
        user_id: 'usr-member-1',
        membership_number: 'TUMCU-2023-0041',
        membership_type_id: '1',
        spiritual_year_id: 'sy-2026',
        status: 'active',
        registration_date: '2023-09-15',
        declaration_id: 'decl-1',
        declaration_signed_at: '2023-09-15T10:00:00.000Z',
      },
      {
        id: 'mem-2',
        user_id: 'usr-member-2',
        membership_number: 'TUMCU-2024-0108',
        membership_type_id: '1',
        spiritual_year_id: 'sy-2026',
        status: 'active',
        registration_date: '2024-02-10',
        declaration_id: 'decl-1',
        declaration_signed_at: '2024-02-10T11:00:00.000Z',
      },
      {
        id: 'mem-3',
        user_id: 'usr-member-3',
        membership_number: 'TUMCU-2024-0215',
        membership_type_id: '1',
        spiritual_year_id: 'sy-2026',
        status: 'active',
        registration_date: '2024-05-18',
        declaration_id: 'decl-1',
        declaration_signed_at: '2024-05-18T09:30:00.000Z',
      },
      {
        id: 'mem-4',
        user_id: 'usr-member-4',
        membership_number: 'TUMCU-2025-0312',
        membership_type_id: '1',
        spiritual_year_id: 'sy-2026',
        status: 'active',
        registration_date: '2025-01-22',
        declaration_id: 'decl-1',
        declaration_signed_at: '2025-01-22T14:15:00.000Z',
      },
    ],
    membership_applications: [
      {
        id: 'app-1',
        user_id: 'usr-applicant-1',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'app-2',
        user_id: 'usr-applicant-2',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'app-3',
        user_id: 'usr-applicant-3',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'app-4',
        user_id: 'usr-applicant-4',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
      },
      {
        id: 'app-5',
        user_id: 'usr-applicant-5',
        membership_type_id: '1',
        status: 'submitted',
        rejection_reason: null,
        created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      },
    ],
    refresh_tokens: [],
    security_events: [],
    attendance_sessions: [],
    attendance_records: [],
    attendance: [],
    income: [],
    expenses: [],
    welfare_cases: [],
    assets: [],
    library_resources: [
      {
        id: 'lib-1',
        title: 'Knowing God',
        author: 'J.I. Packer',
        category: 'Theology',
        isbn: '978-0830816507',
        shelf_location: 'Shelf A-1 (Main Library)',
        condition_status: 'good',
        physical_copies_total: 4,
        physical_copies_available: 3,
        borrowed_count: 1,
        is_digital: 1,
        cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
        file_url: '/uploads/resources/knowing-god-study-guide.pdf',
        description: 'For over 40 years, J.I. Packer classic has helped Christians around the world discover the wonder, the glory, and the joy of knowing God personally.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'lib-2',
        title: 'The Cross of Christ',
        author: 'John Stott',
        category: 'Doctrine',
        isbn: '978-0830833207',
        shelf_location: 'Shelf A-2 (Main Library)',
        condition_status: 'excellent',
        physical_copies_total: 3,
        physical_copies_available: 2,
        borrowed_count: 1,
        is_digital: 0,
        cover_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
        file_url: null,
        description: 'A masterpiece from one of the greatest evangelical minds of the 20th century explaining the heart of biblical Christianity.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'lib-3',
        title: 'Desiring God: Meditations of a Christian Hedonist',
        author: 'John Piper',
        category: 'Christian Living',
        isbn: '978-1601423108',
        shelf_location: 'Shelf B-1 (Main Library)',
        condition_status: 'good',
        physical_copies_total: 3,
        physical_copies_available: 3,
        borrowed_count: 0,
        is_digital: 1,
        cover_image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
        file_url: '/uploads/resources/desiring-god-guide.pdf',
        description: 'God is most glorified in us when we are most satisfied in Him. A deeply biblical and transforming work on holy passion.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'lib-4',
        title: 'Spiritual Leadership: Principles of Excellence For Every Believer',
        author: 'J. Oswald Sanders',
        category: 'Leadership',
        isbn: '978-0802416704',
        shelf_location: 'Shelf B-2 (Main Library)',
        condition_status: 'good',
        physical_copies_total: 5,
        physical_copies_available: 4,
        borrowed_count: 1,
        is_digital: 0,
        cover_image_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=400&q=80',
        file_url: null,
        description: 'Essential reading for every Christian Union leader, coordinator, committee member, and believer aspiring to biblical leadership.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'lib-5',
        title: 'Mere Christianity',
        author: 'C.S. Lewis',
        category: 'Apologetics',
        isbn: '978-0060652920',
        shelf_location: 'Shelf C-1 (Main Library)',
        condition_status: 'good',
        physical_copies_total: 4,
        physical_copies_available: 4,
        borrowed_count: 0,
        is_digital: 1,
        cover_image_url: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=400&q=80',
        file_url: '/uploads/resources/mere-christianity-study.pdf',
        description: 'The classic defense of the Christian faith, exploring moral law, the Trinity, and Christian virtues with brilliant clarity.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'lib-6',
        title: 'TUMCU Constitution 2024 Edition & Governance Guidelines',
        author: 'Constitutional Review Commission',
        category: 'Governance & Constitution',
        isbn: 'TUMCU-CONST-2024',
        shelf_location: 'Special Reference Shelf (Ref-1)',
        condition_status: 'mint',
        physical_copies_total: 2,
        physical_copies_available: 2,
        borrowed_count: 0,
        is_digital: 1,
        cover_image_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=80',
        file_url: '/uploads/resources/tumcu-constitution-2024.pdf',
        description: 'The supreme governing constitutional framework, doctrinal basis, election rules, and ministry articles of TUM Christian Union.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'lib-7',
        title: 'The Pursuit of Holiness',
        author: 'Jerry Bridges',
        category: 'Christian Growth',
        isbn: '978-1576839324',
        shelf_location: 'Shelf C-2 (Main Library)',
        condition_status: 'good',
        physical_copies_total: 3,
        physical_copies_available: 3,
        borrowed_count: 0,
        is_digital: 0,
        cover_image_url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=400&q=80',
        file_url: null,
        description: 'Be holy, for I am holy. Jerry Bridges examines what holiness is and how believers cooperate with the Holy Spirit to pursue it.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'lib-8',
        title: 'Systematic Theology: An Introduction to Biblical Doctrine',
        author: 'Wayne Grudem',
        category: 'Theology',
        isbn: '978-0310286707',
        shelf_location: 'Reference Reserve (Ref-2)',
        condition_status: 'excellent',
        physical_copies_total: 2,
        physical_copies_available: 2,
        borrowed_count: 0,
        is_digital: 0,
        cover_image_url: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=400&q=80',
        file_url: null,
        description: 'Comprehensive, biblical, lucid, and practical introduction to core doctrines of the faith.',
        created_at: new Date().toISOString(),
      },
    ],
    library_borrowings: [
      {
        id: 'bor-1',
        resource_id: 'lib-1',
        user_id: 'usr-member-1',
        user_name: 'Grace Wanjiku',
        user_email: 'grace.wanjiku@tum.ac.ke',
        user_phone: '+254711000001',
        user_admission_number: 'BSCS/2023/1101',
        borrowed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        due_at: new Date(Date.now() + 10 * 86400000).toISOString(),
        returned_at: null,
        status: 'active',
        notes: 'Borrowing for personal devotion and BEST group preparation.',
      },
      {
        id: 'bor-2',
        resource_id: 'lib-4',
        user_id: 'usr-member-2',
        user_name: 'Brian Kiprop',
        user_email: 'brian.kiprop@tum.ac.ke',
        user_phone: '+254711000002',
        user_admission_number: 'BENG/2022/3342',
        borrowed_at: new Date(Date.now() - 8 * 86400000).toISOString(),
        due_at: new Date(Date.now() + 6 * 86400000).toISOString(),
        returned_at: null,
        status: 'active',
        notes: 'Reading for ministry stewardship.',
      },
    ],
    library_reservations: [
      {
        id: 'res-1',
        resource_id: 'lib-2',
        user_id: 'usr-member-3',
        user_name: 'Faith Achieng',
        user_email: 'faith.achieng@tum.ac.ke',
        user_admission_number: 'BBIT/2024/0912',
        requested_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        needed_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        status: 'pending',
        notes: 'Need this physical copy for my discipleship assignment.',
      },
    ],
    broadcast_messages: [],
    notifications: [],
    elections: [],
    election_posts: [],
    election_candidates: [],
    election_votes: [],
    election_activity_logs: [],
    reports: [],
    audit_logs: [
      {
        id: 'aud-1',
        user_id: 'usr-admin-1',
        action: 'system.initialize',
        entity_type: 'system_core',
        entity_id: 'sys-core',
        old_values: null,
        new_values: JSON.stringify({ constitution: 'TUMCU Constitution 2024 Edition', spiritual_year: '2025/2026' }),
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'aud-2',
        user_id: 'usr-admin-1',
        action: 'membership.declaration.publish',
        entity_type: 'membership_declaration',
        entity_id: 'decl-1',
        old_values: null,
        new_values: JSON.stringify({ version: '2024.1', title: 'TUMCU Doctrinal Basis & Constitutional Declaration' }),
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      },
      {
        id: 'aud-3',
        user_id: 'usr-admin-1',
        action: 'leadership.roster.certified',
        entity_type: 'leadership_assignments',
        entity_id: 'roster-2026',
        old_values: null,
        new_values: JSON.stringify({ academic_year: '2025/2026', active_executive_officers: 15 }),
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'aud-4',
        user_id: 'usr-admin-1',
        action: 'finance.budget.approved',
        entity_type: 'finance_resolution',
        entity_id: 'res-2026-001',
        old_values: null,
        new_values: JSON.stringify({ resolution_number: 'RES/2026/001', amount: 45000, category: 'Missions Outreach' }),
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
    bible_study_groups: [],
    mentorship_groups: [],
    evangelism_teams: [
      {
        id: 'eteam-noret',
        code: 'NET-TUM',
        name: 'NET MINISTRIES TRUST TUM UNIT',
        region: 'Northern & Central Rift / Western Missions',
        description: 'Passionate evangelism team dedicated to spreading the gospel of Jesus Christ, planting campus prayer altars, and conducting missions to the Northern & Rift regions.',
        motto: 'Proclaiming the Light to the Nations',
        scripture_verse: 'Isaiah 9:2 — The people walking in darkness have seen a great light; on those living in the land of deep darkness, a light has dawned.',
        chairperson_id: null,
        chairperson_name: null,
        chairperson_phone: null,
        meeting_day: 'Monday (Alternating)',
        meeting_time: '5:00 PM – 7:00 PM',
        meeting_venue: 'Hall 4 / Student Center Grounds',
        target_mission_area: 'Turkana & Baringo Cross-Cultural Missions',
        banner_image_url: '/community/community-5.jpg',
        active_members_count: 54,
        is_active: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'eteam-soret',
        code: 'NORET-SORET',
        name: 'NORET-SORET',
        region: 'Southern Rift / Eastern & Coastal Missions',
        description: 'Dynamic evangelism team mobilizing campus disciples for grassroots door-to-door evangelism, school ministries, and coastal village missions.',
        motto: 'Arise and Shine for Your Light Has Come',
        scripture_verse: 'Romans 10:15 — How beautiful are the feet of those who bring good news!',
        chairperson_id: null,
        chairperson_name: null,
        chairperson_phone: null,
        meeting_day: 'Monday (Alternating)',
        meeting_time: '5:00 PM – 7:00 PM',
        meeting_venue: 'Assembly Grounds / Annex Lecture Theatre',
        target_mission_area: 'Kilifi, Kwale & Taita Taveta Outreaches',
        banner_image_url: '/community/community-3.jpg',
        active_members_count: 62,
        is_active: 1,
        created_at: new Date().toISOString(),
      },
    ],
    eteam_programmes: [
      {
        id: 'ep-1',
        eteam_id: 'eteam-noret',
        title: 'NET TUM UNIT Monday Fellowship & Prayer Altar',
        date: '2026-09-21',
        time: '5:00 PM – 7:00 PM',
        venue: 'Hall 4',
        focus: 'Intercession for Northern Kenya Missions & Spiritual Preparation',
        leader: null,
      },
      {
        id: 'ep-2',
        eteam_id: 'eteam-soret',
        title: 'NORET-SORET Monday Fellowship & Regional Strategy',
        date: '2026-09-21',
        time: '5:00 PM – 7:00 PM',
        venue: 'Assembly Grounds Annex',
        focus: 'School Ministry Mobilization & Coast Weekend Mission',
        leader: null,
      },
      {
        id: 'ep-3',
        eteam_id: 'eteam-noret',
        title: 'NET TUM UNIT Weekend Secondary School Outreach',
        date: '2026-10-10',
        time: '8:00 AM – 3:00 PM',
        venue: 'Mombasa Secondary Schools',
        focus: 'Gospel crusade and peer discipleship',
        leader: 'NET TUM UNIT Missions Committee',
      },
      {
        id: 'ep-4',
        eteam_id: 'eteam-soret',
        title: 'NORET-SORET Coastal Village Door to Door Outreach',
        date: '2026-10-17',
        time: '8:30 AM – 4:00 PM',
        venue: 'Kisauni & Likoni Outskirts',
        focus: 'Community evangelism and medical benevolence',
        leader: 'NORET-SORET Missions Committee',
      },
    ],
    eteam_gallery: [
      {
        id: 'eg-1',
        eteam_id: 'eteam-noret',
        title: 'NET TUM UNIT Missions Team in Northern Kenya',
        image_url: '/community/community-5.jpg',
        google_photos_url: 'https://photos.google.com/share/noret-missions',
        caption: 'Sharing the gospel of grace in cross-cultural missions.',
      },
      {
        id: 'eg-2',
        eteam_id: 'eteam-soret',
        title: 'NORET-SORET High School Ministry Fellowship',
        image_url: '/community/community-3.jpg',
        google_photos_url: 'https://photos.google.com/share/soret-outreach',
        caption: 'Ministering to secondary school students with passion.',
      },
    ],
    eteam_reports: [
      {
        id: 'er-1',
        eteam_id: 'eteam-noret',
        title: 'NET TUM UNIT Annual Mission Report 2025/2026',
        author: null,
        report_date: '2026-08-15',
        summary: 'Reached over 1,200 souls with 184 giving their lives to Christ and 4 new village fellowship altars planted.',
        content: 'Detailed report covering budget utilization, convert follow-up, partner churches in Baringo, and future mission pipeline.',
      },
      {
        id: 'er-2',
        eteam_id: 'eteam-soret',
        title: 'NORET-SORET Coastal Evangelism Impact Report',
        author: null,
        report_date: '2026-08-20',
        summary: 'Visited 14 secondary schools and 6 churches across Kilifi and Kwale counties.',
        content: 'Report outlining youth ministry impact, distributed bibles, and mentorship follow-up cohorts established.',
      },
    ],
    eteam_announcements: [
      {
        id: 'ea-1',
        eteam_id: 'eteam-noret',
        title: 'Preparation for E-Teams Sunday & Mission Offering',
        content: 'All NET TUM UNIT members are requested to gather this Monday at Hall 4 at 5:00 PM prompt for choir rehearsal and prayer.',
        posted_at: new Date().toISOString(),
      },
      {
        id: 'ea-2',
        eteam_id: 'eteam-soret',
        title: 'Coast Outreach Registration Now Open',
        content: 'Sign-ups for the upcoming October coastal high school outreach are ongoing. Contact the missions coordinator.',
        posted_at: new Date().toISOString(),
      },
    ],
    landing_media_config: [
      {
        id: 'cfg-1',
        rotate_interval_ms: 4000,
        background_image_url: '/tum-gate-monument.jpg',
        background_title: 'TUM Main Entrance Gate Monument',
        background_opacity: 0.8,
        background_blur_px: 1,
        last_updated_by: 'Meshack Okoth (Super Administrator)',
        last_updated_at: new Date().toISOString(),
      },
    ],
    landing_media_slides: [
      { id: 'slide-1', title: 'Manifesting the Light of Christ', subtitle: 'Matthew 5:16 — Let your light shine before men', image_url: '/community/community-1.jpg', display_order: 1, is_active: 1 },
      { id: 'slide-2', title: 'Worship in Spirit and Truth', subtitle: 'One Family • One Faith • One Lord', image_url: '/community/community-2.jpg', display_order: 2, is_active: 1 },
      { id: 'slide-3', title: 'Discipleship & Deep Scripture', subtitle: 'BEST Bible Study Classes Every Tuesday', image_url: '/community/community-3.jpg', display_order: 3, is_active: 1 },
      { id: 'slide-4', title: 'Empowering Every Believer', subtitle: 'Academic Excellence and Divine Purpose', image_url: '/community/community-4.jpg', display_order: 4, is_active: 1 },
      { id: 'slide-5', title: 'Evangelism & Coast Impact', subtitle: 'NET MINISTRIES TRUST TUM UNIT & NORET-SORET Reaching Coast and Beyond', image_url: '/community/community-5.jpg', display_order: 5, is_active: 1 },
    ],
    landing_media_gallery: [
      { id: 'gal-1', image_url: '/community/community-3.jpg', caption: 'TUMCU students fellowship & prayer session', display_order: 1, span: 'featured' },
      { id: 'gal-2', image_url: '/community/community-2.jpg', caption: 'Campus worship ministry team in praise', display_order: 2, span: 'normal' },
      { id: 'gal-3', image_url: '/community/community-5.jpg', caption: 'Christian union members bonding and discipleship', display_order: 3, span: 'normal' },
      { id: 'gal-4', image_url: '/community/community-1.jpg', caption: 'Corporate intercession & prayer altar', display_order: 4, span: 'normal' },
      { id: 'gal-5', image_url: '/community/community-4.jpg', caption: 'Music ministry worship & instrumentals', display_order: 5, span: 'normal' },
    ],
    gallery_albums: [
      {
        id: 'album-1',
        title: 'Semester Orientation & First Years Welcome 2026',
        category: 'Orientation',
        event_type: 'service',
        event_date: '2026-09-06',
        description: 'Joyful orientation services, campus tours, and welcoming freshmen into the TUMCU family.',
        cover_image_url: '/community/community-1.jpg',
        google_photos_url: 'https://photos.google.com/share/tumcu-orientation-2026',
        photo_count: 48,
        is_published: 1,
        created_by: 'usr-admin-1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'album-2',
        title: 'Friday Main Fellowship Nights',
        category: 'Fellowship',
        event_type: 'fellowship',
        event_date: '2026-09-18',
        description: 'Moments of explosive praise, heartfelt worship, and deep revelation from the pulpit.',
        cover_image_url: '/community/community-2.jpg',
        google_photos_url: 'https://photos.google.com/share/tumcu-friday-fellowship',
        photo_count: 85,
        is_published: 1,
        created_by: 'usr-admin-1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'album-3',
        title: 'Nyali Beach Retreat & Team Building',
        category: 'Retreat',
        event_type: 'retreat',
        event_date: '2026-09-19',
        description: 'Christian Union beach retreat, games, fellowship, prayer walks, and bonding along the Indian Ocean.',
        cover_image_url: '/community/community-3.jpg',
        google_photos_url: 'https://photos.google.com/share/tumcu-beach-retreat-2026',
        photo_count: 120,
        is_published: 1,
        created_by: 'usr-admin-1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'album-4',
        title: 'Missions & Coast Evangelism Outreach',
        category: 'Missions',
        event_type: 'mission',
        event_date: '2026-09-28',
        description: 'NORET and SORET evangelism teams ministering to local communities and schools across Mombasa.',
        cover_image_url: '/community/community-5.jpg',
        google_photos_url: 'https://photos.google.com/share/tumcu-coast-missions',
        photo_count: 64,
        is_published: 1,
        created_by: 'usr-admin-1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'album-5',
        title: 'Night of Encounter Prayer Kesha',
        category: 'Prayer',
        event_type: 'service',
        event_date: '2026-10-16',
        description: 'All night intercession, seeking the face of God, healing, and spiritual renewal.',
        cover_image_url: '/community/community-4.jpg',
        google_photos_url: 'https://photos.google.com/share/tumcu-prayer-kesha',
        photo_count: 42,
        is_published: 1,
        created_by: 'usr-admin-1',
        created_at: new Date().toISOString(),
      },
    ],
    committee_members: [],
    ministry_members: [],
    ministry_trainings: [],
    leadership_archives: [],
  },
};

// Seed role permissions in memory
const rolePermissionMap: Record<string, string[]> = {
  // Super Admin: unrestricted technical system administrator
  'role-1': memoryDb.tables.permissions.map((p) => p.code),
  // System Admin: technical system operations and access management
  'role-2': [
    'system.manage_roles', 'system.manage_permissions', 'system.health', 'system.settings',
    'audit.view', 'leadership.view', 'membership.view_all', 'reports.view'
  ],
  // Chairperson: constitutional executive leader (NOT technical super admin)
  'role-3': [
    'leadership.view', 'leadership.assign', 'membership.view_all', 'membership.review', 'membership.approve',
    'meetings.view', 'meetings.create', 'meetings.edit', 'meetings.manage_minutes', 'meetings.approve_minutes',
    'finance.view', 'finance.approve', 'events.view', 'events.create', 'events.edit', 'events.approve',
    'ministries.view', 'committees.view', 'reports.view', 'reports.create', 'communication.view', 'communication.create',
    'prayer.view', 'prayer.create', 'attendance.view', 'attendance.record', 'elections.view',
    'library.view', 'gallery.view', 'eteams.view', 'programmes.view', 'programmes.manage'
  ],
  // 1st Vice Chairperson
  'role-4': [
    'welfare.view', 'welfare.create', 'welfare.edit', 'welfare.approve',
    'reports.view', 'leadership.view', 'ministries.view', 'committees.view',
    'membership.view_all', 'meetings.view', 'events.view', 'events.register',
    'attendance.view', 'attendance.record', 'prayer.view', 'prayer.create', 'finance.request',
    'library.view', 'gallery.view', 'eteams.view', 'programmes.view'
  ],
  // 2nd Vice Chairperson
  'role-5': [
    'associates.view', 'associates.manage', 'ministries.view', 'ministries.manage_members',
    'meetings.view', 'events.view', 'events.register', 'attendance.view', 'attendance.record',
    'prayer.view', 'prayer.create', 'finance.request',
    'library.view', 'gallery.view', 'eteams.view', 'programmes.view'
  ],
  // Secretary
  'role-6': [
    'membership.create', 'membership.review', 'membership.view_all', 'membership.edit', 'membership.approve',
    'meetings.view', 'meetings.create', 'meetings.edit', 'meetings.delete', 'meetings.manage_minutes', 'meetings.approve_minutes',
    'attendance.view', 'attendance.record', 'attendance.manage_sessions', 'attendance.export',
    'communication.view', 'communication.create', 'communication.edit', 'communication.delete',
    'reports.create', 'reports.view', 'ministries.view', 'ministries.manage_members', 'ministries.edit',
    'leadership.view', 'leadership.assign', 'events.view', 'events.create', 'events.edit', 'events.register',
    'prayer.view', 'prayer.create', 'finance.view', 'finance.request',
    'library.view', 'gallery.view', 'eteams.view', 'programmes.view', 'programmes.manage'
  ],
  // Treasurer
  'role-7': [
    'finance.view', 'finance.request', 'finance.approve', 'reports.create', 'reports.view',
    'meetings.view', 'events.view', 'events.register', 'attendance.view', 'attendance.record',
    'prayer.view', 'prayer.create', 'assets.view', 'library.view', 'gallery.view', 'eteams.view'
  ],
  // Prayer Committee Chairperson
  'role-8': [
    'prayer.view', 'prayer.view_confidential', 'prayer.create', 'prayer.edit', 'prayer.delete',
    'meetings.view', 'events.view', 'events.register', 'attendance.view', 'attendance.record',
    'ministries.view', 'finance.request', 'library.view', 'gallery.view', 'eteams.view'
  ],
  // Ministry Leader
  'role-9': [
    'ministries.view', 'ministries.manage_members', 'ministries.edit',
    'meetings.view', 'meetings.create', 'attendance.view', 'attendance.record', 'attendance.manage_sessions',
    'reports.create', 'reports.view', 'events.view', 'events.register', 'prayer.view', 'prayer.create',
    'finance.view', 'finance.request', 'library.view', 'gallery.view', 'eteams.view'
  ],
  // Member
  'role-10': [
    'events.view', 'events.register', 'events.check_in', 'ministries.view',
    'prayer.view', 'prayer.create', 'attendance.view', 'attendance.record',
    'meetings.view', 'finance.request',
    'library.view', 'library.request', 'gallery.view', 'eteams.view', 'programmes.view'
  ],
  // Librarian & Resource Custodian
  'role-11': [
    'library.view', 'library.request', 'library.create', 'library.edit', 'library.delete',
    'library.manage_inventory', 'library.manage_requests', 'library.checkout', 'library.return',
    'library.view_reports', 'reports.view', 'reports.create', 'meetings.view', 'events.view',
    'assets.view', 'assets.manage', 'finance.request'
  ],
  // NORET Evangelism Team Chairperson
  'role-12': [
    'eteams.view', 'eteams.manage_team', 'eteams.manage_programmes', 'eteams.manage_gallery',
    'eteams.manage_reports', 'eteams.manage_announcements', 'reports.view', 'reports.create',
    'meetings.view', 'events.view', 'prayer.view', 'prayer.create', 'finance.request', 'attendance.record'
  ],
  // SORET Evangelism Team Chairperson
  'role-13': [
    'eteams.view', 'eteams.manage_team', 'eteams.manage_programmes', 'eteams.manage_gallery',
    'eteams.manage_reports', 'eteams.manage_announcements', 'reports.view', 'reports.create',
    'meetings.view', 'events.view', 'prayer.view', 'prayer.create', 'finance.request', 'attendance.record'
  ],
  // Media Ministry Leader
  'role-14': [
    'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.delete', 'gallery.publish',
    'media.manage_landing', 'media.manage_ministries', 'ministries.view', 'ministries.edit',
    'events.view', 'reports.view', 'reports.create', 'finance.request'
  ],
};

const memberPermCodes = rolePermissionMap['role-10'];

for (const [roleId, codes] of Object.entries(rolePermissionMap)) {
  for (const code of codes) {
    const perm = memoryDb.tables.permissions.find((p) => p.code === code);
    if (perm) {
      memoryDb.tables.role_permissions.push({
        id: uuidv4(),
        role_id: roleId,
        permission_id: perm.id,
      });
    }
  }
}

// Disk Persistence for preview / standalone mode
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'tecump_store.json');

function initDiskStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const [table, rows] of Object.entries(parsed)) {
          if (Array.isArray(rows) && rows.length > 0) {
            if (!memoryDb.tables[table]) {
              memoryDb.tables[table] = rows as Record<string, any>[];
            } else {
              const existingIds = new Set(memoryDb.tables[table].map((r: any) => r.id));
              for (const row of rows as Record<string, any>[]) {
                if (!existingIds.has(row.id)) {
                  memoryDb.tables[table].push(row);
                } else {
                  const idx = memoryDb.tables[table].findIndex((r: any) => r.id === row.id);
                  if (idx >= 0) {
                    memoryDb.tables[table][idx] = { ...memoryDb.tables[table][idx], ...row };
                  }
                }
              }
            }
          }
        }
        logger.info('Loaded persisted store from disk successfully.');
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Could not load store from disk, continuing with seeded memory store.');
  }
}

let saveTimeout: NodeJS.Timeout | null = null;
export function scheduleSaveToDisk() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(memoryDb.tables, null, 2), 'utf8');
    } catch (err) {
      logger.warn({ err }, 'Failed to persist memory store to disk');
    }
  }, 100);
}

initDiskStore();

let mysqlPool: mysql.Pool | null = null;
// Default to the persistent JSON disk store; switched to false only when MySQL is actively verified
let useMemoryStore = true;

try {
  mysqlPool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: env.DB_CONNECTION_LIMIT,
    waitForConnections: true,
    namedPlaceholders: true,
    dateStrings: true,
  });
} catch (e) {
  logger.warn({ err: e }, 'MySQL pool initialization deferred — using persistent store.');
}

// In-Memory Query Engine Helper
function executeInMemoryQuery(sql: string, params: Record<string, any> = {}): any {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');
  const upperSql = cleanSql.toUpperCase();

  // 1. Permission checks join (role_permissions + permissions + user_roles)
  if (cleanSql.includes('permissions') && cleanSql.includes('user_roles')) {
    const userId = params.userId || params.user_id;
    let userRoles = memoryDb.tables.user_roles.filter((ur) => ur.user_id === userId && ur.is_current !== false);

    // Purely database-driven: only role-1 (super_admin) has all permissions wildcard
    if (userRoles.some((ur) => ur.role_id === 'role-1')) {
      return [memoryDb.tables.permissions.map((p) => ({ code: p.code, module: p.module }))];
    }

    const assignedRoleIds = new Set(userRoles.map((ur) => ur.role_id));
    // Always include member role permissions as baseline
    assignedRoleIds.add('role-10');

    const permMap = new Map<string, { code: string; module: string }>();
    for (const roleId of assignedRoleIds) {
      const perms = memoryDb.tables.role_permissions
        .filter((rp) => rp.role_id === roleId)
        .map((rp) => memoryDb.tables.permissions.find((p) => p.id === rp.permission_id))
        .filter(Boolean);
      for (const p of perms) {
        if (p && !permMap.has(p.code)) {
          permMap.set(p.code, { code: p.code, module: p.module });
        }
      }
    }

    return [Array.from(permMap.values())];
  }

  // 2. User Roles join
  if (cleanSql.includes('user_roles') && (cleanSql.includes('roles') || cleanSql.includes('role_id'))) {
    const userId = params.userId || params.user_id;
    let userRoles = memoryDb.tables.user_roles.filter((ur) => !userId || (ur.user_id === userId && ur.is_current !== false));
    if (userRoles.length === 0 && userId) {
      const defaultUr = { id: uuidv4(), user_id: userId, role_id: 'role-10', scope_type: null, scope_id: null, is_current: true };
      memoryDb.tables.user_roles.push(defaultUr);
      userRoles = [defaultUr];
    }
    const rows = userRoles.map((ur) => {
      const role = memoryDb.tables.roles.find((r) => r.id === ur.role_id);
      return {
        role_id: ur.role_id,
        role_code: role?.code || 'member',
        code: role?.code || 'member',
        name: role?.name || 'Member',
        category: role?.category || 'general',
        scope_type: ur.scope_type || null,
        scope_id: ur.scope_id || null,
        is_current: ur.is_current !== false,
      };
    });
    return [rows.length > 0 ? rows : [{ role_id: 'role-10', role_code: 'member', code: 'member', name: 'Member', category: 'general', scope_type: null, scope_id: null, is_current: true }]];
  }

  // 3. User Scopes check
  if (cleanSql.includes('scope_type') && cleanSql.includes('user_roles')) {
    const userId = params.userId || params.user_id;
    const userRoles = memoryDb.tables.user_roles.filter((ur) => (!userId || ur.user_id === userId) && ur.scope_type && ur.scope_id);
    return [userRoles.map((ur) => ({ scope_type: ur.scope_type, scope_id: ur.scope_id }))];
  }

  // 4. Membership Applications query (with automatic user join)
  if (cleanSql.includes('membership_applications') && !upperSql.startsWith('INSERT') && !upperSql.startsWith('UPDATE') && !upperSql.startsWith('DELETE')) {
    let apps = memoryDb.tables.membership_applications ? [...memoryDb.tables.membership_applications] : [];

    if (upperSql.includes('COUNT(*)')) {
      if (params.status) {
        apps = apps.filter((a) => a.status === params.status);
      } else if (cleanSql.includes("'submitted'") || cleanSql.includes('"submitted"')) {
        apps = apps.filter((a) => a.status === 'submitted');
      } else if (cleanSql.includes("status IN ('submitted', 'under_review')")) {
        apps = apps.filter((a) => a.status === 'submitted' || a.status === 'under_review');
      }
      return [[{ total: apps.length, count: apps.length }]];
    }

    if (params.status) {
      apps = apps.filter((a) => a.status === params.status);
    } else if (cleanSql.includes("status IN ('submitted', 'under_review')")) {
      apps = apps.filter((a) => a.status === 'submitted' || a.status === 'under_review');
    }

    if (params.userId || params.user_id) {
      const uid = params.userId || params.user_id;
      apps = apps.filter((a) => (a.user_id === uid || a.userId === uid));
    }
    if (params.id) {
      apps = apps.filter((a) => a.id === params.id);
    }

    const rows = apps.map((ma) => {
      const userId = ma.user_id || ma.userId;
      const typeId = ma.membership_type_id || ma.membershipTypeId;
      const user = memoryDb.tables.users.find((u) => u.id === userId);
      const mt = memoryDb.tables.membership_types.find((t) => t.id === typeId || t.code === typeId);
      return {
        id: ma.id,
        status: ma.status,
        rejection_reason: ma.rejection_reason || ma.rejectionReason || null,
        created_at: ma.created_at,
        user_id: user?.id || userId,
        full_name: user?.full_name || user?.fullName || 'Student Applicant',
        email: user?.email || '',
        admission_number: user?.admission_number || user?.admissionNumber || '',
        phone: user?.phone_number || user?.phone || '',
        phone_number: user?.phone_number || user?.phone || '',
        course: user?.course || 'General Student',
        year_of_study: user?.year_of_study || 1,
        school: user?.school || '',
        membership_type_name: mt?.name || 'Full Member (Student)',
      };
    });

    if (params.limit && typeof params.limit === 'number') {
      const offset = Number(params.offset) || 0;
      return [rows.slice(offset, offset + params.limit)];
    }
    return [rows];
  }

  // 5. Active spiritual year / active declaration
  if (cleanSql.includes('spiritual_years') && upperSql.includes('IS_CURRENT')) {
    const sy = memoryDb.tables.spiritual_years.find((s) => s.is_current);
    return [[sy || { id: 'sy-2026' }]];
  }
  if (cleanSql.includes('membership_declarations') && upperSql.includes('IS_ACTIVE')) {
    const decl = memoryDb.tables.membership_declarations.find((d) => d.is_active);
    return [[decl || { id: 'decl-1' }]];
  }

  // 6. Attendance Roster / Records with user info
  if (cleanSql.includes('attendance_records') && (cleanSql.includes('users') || upperSql.includes('ROSTER') || cleanSql.includes('session_id') || cleanSql.includes('attendable_id'))) {
    const sessionId = params.sessionId || params.session_id || params.attendableId || params.attendable_id;
    let records = memoryDb.tables.attendance_records || [];
    if (sessionId) {
      records = records.filter((r) => r.session_id === sessionId || r.attendable_id === sessionId);
    }
    const rows = records.map((rec) => {
      const user = rec.user_id ? memoryDb.tables.users.find((u) => u.id === rec.user_id) : null;
      const membership = rec.user_id ? memoryDb.tables.memberships.find((m) => m.user_id === rec.user_id && m.status === 'active') : null;
      return {
        id: rec.id,
        session_id: rec.session_id || rec.attendable_id,
        user_id: rec.user_id || null,
        full_name: user?.full_name || rec.guest_name || 'Anonymous Guest',
        email: user?.email || rec.guest_email || '',
        phone_number: user?.phone_number || rec.guest_phone || '',
        admission_number: user?.admission_number || '',
        membership_number: membership?.membership_number || null,
        is_member: !!user,
        status: rec.status || 'present',
        visitor_type: rec.visitor_type || (user ? 'none' : 'first_time'),
        method: rec.method || 'qr_code',
        checked_in_at: rec.checked_in_at || new Date().toISOString(),
        notes: rec.notes || null,
        prayer_request: rec.prayer_request || null,
        school_faculty: user?.school || rec.guest_category || null,
        year_of_study: user?.year_of_study || null,
      };
    });
    return [rows];
  }

  // 7. Leadership Assignments with Position and User Details
  if (cleanSql.includes('leadership_assignments')) {
    let assignments = memoryDb.tables.leadership_assignments || [];
    if (params.id) {
      assignments = assignments.filter((a) => a.id === params.id);
    }
    if (params.userId || params.user_id) {
      const uid = params.userId || params.user_id;
      assignments = assignments.filter((a) => a.user_id === uid);
    }
    if (params.positionId || params.position_id) {
      const pid = params.positionId || params.position_id;
      assignments = assignments.filter((a) => a.position_id === pid);
    }
    if (params.status) {
      assignments = assignments.filter((a) => a.status === params.status);
    }

    const rows = assignments.map((a) => {
      const pos = (memoryDb.tables.leadership_positions || []).find((p) => p.id === a.position_id);
      const user = a.user_id ? (memoryDb.tables.users || []).find((u) => u.id === a.user_id) : null;
      return {
        ...a,
        position_name: pos?.name || '',
        position_code: pos?.code || '',
        position_category: pos?.category || 'executive',
        constitutional_reference: pos?.constitutional_reference || '',
        responsibilities: pos?.responsibilities || [],
        permissions: pos?.permissions || [],
        constitutional_restrictions: pos?.constitutional_restrictions || [],
        user_name: user?.full_name || (a.status === 'vacant' ? 'VACANT' : 'Unassigned'),
        user_email: user?.email || '',
        user_phone: user?.phone_number || '',
        user_admission_number: user?.admission_number || '',
        user_course: user?.course || '',
        user_year: user?.year_of_study || '',
      };
    });
    return [rows];
  }

  // Helper to extract table name from simple SELECT / INSERT / UPDATE / DELETE
  const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
  const insertMatch = cleanSql.match(/INSERT\s+(?:IGNORE\s+)?INTO\s+([a-zA-Z0-9_]+)/i);
  const updateMatch = cleanSql.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
  const deleteMatch = cleanSql.match(/DELETE\s+(?:[a-zA-Z0-9_]+\s+)?FROM\s+([a-zA-Z0-9_]+)/i);

  const targetTable = (fromMatch?.[1] || insertMatch?.[1] || updateMatch?.[1] || deleteMatch?.[1] || '').toLowerCase();

  // Ensure table exists in memory
  if (targetTable && !memoryDb.tables[targetTable]) {
    memoryDb.tables[targetTable] = [];
  }

  // --- 1. INSERT ---
  if (upperSql.startsWith('INSERT')) {
    const table = targetTable;
    const row: Record<string, any> = { ...params };
    if (!row.id) row.id = uuidv4();
    if (!row.created_at) row.created_at = new Date().toISOString();

    // Map common camelCase / snake_case equivalents
    if (params.userId !== undefined && row.user_id === undefined) row.user_id = params.userId;
    if (params.user_id !== undefined && row.userId === undefined) row.userId = params.user_id;
    if (params.fullName !== undefined && row.full_name === undefined) row.full_name = params.fullName;
    if (params.full_name !== undefined && row.fullName === undefined) row.fullName = params.full_name;
    if (params.phoneNumber !== undefined && row.phone_number === undefined) row.phone_number = params.phoneNumber;
    if (params.admissionNumber !== undefined && row.admission_number === undefined) row.admission_number = params.admissionNumber;
    if (params.department !== undefined && row.department === undefined) row.department = params.department;
    if (params.yearOfStudy !== undefined && row.year_of_study === undefined) row.year_of_study = params.yearOfStudy;
    if (params.passwordHash !== undefined && row.password_hash === undefined) row.password_hash = params.passwordHash;
    if (params.membershipTypeId !== undefined && row.membership_type_id === undefined) row.membership_type_id = params.membershipTypeId;
    if (params.membership_type_id !== undefined && row.membershipTypeId === undefined) row.membershipTypeId = params.membership_type_id;
    if (params.spiritualYearId !== undefined && row.spiritual_year_id === undefined) row.spiritual_year_id = params.spiritualYearId;
    if (params.declarationId !== undefined && row.declaration_id === undefined) row.declaration_id = params.declarationId;
    if (params.membershipNumber !== undefined && row.membership_number === undefined) row.membership_number = params.membershipNumber;

    // Parse literal values in INSERT statement VALUES clause if not provided in params
    if (table === 'membership_applications') {
      if (!row.status) {
        if (cleanSql.includes("'submitted'") || cleanSql.includes('"submitted"')) row.status = 'submitted';
        else if (cleanSql.includes("'under_review'") || cleanSql.includes('"under_review"')) row.status = 'under_review';
        else if (cleanSql.includes("'approved'") || cleanSql.includes('"approved"')) row.status = 'approved';
        else if (cleanSql.includes("'rejected'") || cleanSql.includes('"rejected"')) row.status = 'rejected';
        else row.status = 'submitted';
      }
    }
    if (table === 'memberships') {
      if (!row.status) {
        if (cleanSql.includes("'active'") || cleanSql.includes('"active"')) row.status = 'active';
        else row.status = 'active';
      }
      if (!row.registration_date) row.registration_date = new Date().toISOString().split('T')[0];
      if (!row.registrationDate) row.registrationDate = row.registration_date;
    }
    if (table === 'users') {
      if (!row.account_status) {
        if (cleanSql.includes("'pending_approval'") || cleanSql.includes('"pending_approval"')) row.account_status = 'pending_approval';
        else if (cleanSql.includes("'active'") || cleanSql.includes('"active"')) row.account_status = 'active';
        else if (cleanSql.includes("'rejected'") || cleanSql.includes('"rejected"')) row.account_status = 'rejected';
      }
    }

    // Specific mapping for refresh_tokens
    if (table === 'refresh_tokens') {
      const uId = params.userId || params.user_id;
      const tHash = params.tokenHash || params.token_hash;
      const expAt = params.expiresAt || params.expires_at;
      row.user_id = uId;
      row.userId = uId;
      row.token_hash = tHash;
      row.tokenHash = tHash;
      row.expires_at = expAt ? (expAt instanceof Date ? expAt.toISOString() : String(expAt)) : new Date(Date.now() + 30 * 86400000).toISOString();
      row.expiresAt = row.expires_at;
      row.revoked_at = null;
      row.revokedAt = null;
    }

    // Specific mapping for notifications
    if (table === 'notifications') {
      const uId = params.userId || params.user_id;
      row.user_id = uId;
      row.userId = uId;
      if (!row.type) {
        row.type = cleanSql.includes("'welcome'") ? 'welcome' : (params.type || 'system');
      }
      if (!row.title) {
        if (cleanSql.includes("'Membership Approved!'")) row.title = 'Membership Approved!';
        else if (cleanSql.includes("'Welcome to TUMCU!'")) row.title = 'Welcome to TUMCU!';
        else row.title = params.title || 'Welcome to TUMCU!';
      }
      if (!row.body) {
        if (params.membershipNumber) {
          row.body = `Congratulations! Your TUMCU membership application has been approved. Your official membership number is ${params.membershipNumber}. Welcome to fellowship!`;
        } else {
          row.body = params.body || 'Welcome to the Technical University of Mombasa Christian Union portal.';
        }
      }
      if (!row.channel) {
        row.channel = cleanSql.includes("'email'") ? 'email' : 'in_app';
      }
      if (row.read_at === undefined) row.read_at = null;
      if (row.sent_at === undefined) row.sent_at = new Date().toISOString();
    }

    // Check unique constraints / on duplicate key
    const existingIndex = memoryDb.tables[table]?.findIndex((r) =>
      r.id === row.id ||
      (row.email && r.email === row.email) ||
      (row.code && r.code === row.code) ||
      (table === 'refresh_tokens' && row.token_hash && (r.token_hash === row.token_hash || r.tokenHash === row.token_hash))
    );
    if (existingIndex !== undefined && existingIndex >= 0) {
      memoryDb.tables[table][existingIndex] = { ...memoryDb.tables[table][existingIndex], ...row };
    } else if (memoryDb.tables[table]) {
      memoryDb.tables[table].push(row);
    }
    scheduleSaveToDisk();
    return [{ insertId: 1, affectedRows: 1 }];
  }

  // --- 2. UPDATE ---
  if (upperSql.startsWith('UPDATE')) {
    const table = targetTable;
    const records = memoryDb.tables[table] || [];
    let updatedCount = 0;
    const nowIso = new Date().toISOString();

    for (let i = 0; i < records.length; i++) {
      let matches = false;

      if (params.id && records[i].id === params.id) {
        matches = true;
      } else if (table === 'ministries' && params.id && records[i].code === params.id) {
        matches = true;
      } else if (params.applicationId && records[i].id === params.applicationId) {
        matches = true;
      } else if (params.registrationId && records[i].id === params.registrationId) {
        matches = true;
      } else if (params.candidateId && records[i].id === params.candidateId) {
        matches = true;
      } else if (params.userRoleId && records[i].id === params.userRoleId) {
        matches = true;
      } else if (table === 'refresh_tokens') {
        const tHash = params.tokenHash || params.token_hash;
        const uId = params.userId || params.user_id;
        if (tHash && (records[i].token_hash === tHash || records[i].tokenHash === tHash)) {
          matches = true;
        } else if (uId && (records[i].user_id === uId || records[i].userId === uId)) {
          matches = true;
        }
      } else if (table === 'users' && (params.userId || params.user_id) && records[i].id === (params.userId || params.user_id)) {
        matches = true;
      } else if (table === 'notifications') {
        const uId = params.userId || params.user_id;
        if (params.id && records[i].id === params.id) {
          if (!uId || records[i].user_id === uId || records[i].userId === uId) {
            matches = true;
          }
        } else if (!params.id && uId && (records[i].user_id === uId || records[i].userId === uId)) {
          if (cleanSql.includes('read_at IS NULL') || upperSql.includes('READ_AT IS NULL')) {
            if (!records[i].read_at && !records[i].readAt) {
              matches = true;
            }
          } else {
            matches = true;
          }
        }
      }

      if (matches) {
        const updatePayload: Record<string, any> = { ...params, updated_at: nowIso };
        if (cleanSql.includes('read_at = NOW()') || upperSql.includes('READ_AT = NOW()') || cleanSql.includes('read_at = now()')) {
          updatePayload.read_at = nowIso;
          updatePayload.readAt = nowIso;
        }
        if (cleanSql.includes('sent_at = NOW()') || upperSql.includes('SENT_AT = NOW()') || cleanSql.includes('sent_at = now()')) {
          updatePayload.sent_at = nowIso;
          updatePayload.sentAt = nowIso;
        }
        if (cleanSql.includes('revoked_at = NOW()') || upperSql.includes('REVOKED_AT = NOW()')) {
          updatePayload.revoked_at = nowIso;
          updatePayload.revokedAt = nowIso;
        }
        if (cleanSql.includes('reviewed_at = NOW()') || upperSql.includes('REVIEWED_AT = NOW()')) {
          updatePayload.reviewed_at = nowIso;
          updatePayload.reviewedAt = nowIso;
        }
        if (cleanSql.includes('last_login_at = NOW()') || upperSql.includes('LAST_LOGIN_AT = NOW()')) {
          updatePayload.last_login_at = nowIso;
        }
        if (cleanSql.includes("status = 'approved'") || cleanSql.includes('status = "approved"')) {
          updatePayload.status = 'approved';
        }
        if (cleanSql.includes("status = 'rejected'") || cleanSql.includes('status = "rejected"')) {
          updatePayload.status = 'rejected';
        }
        if (cleanSql.includes("status = 'under_review'") || cleanSql.includes('status = "under_review"')) {
          updatePayload.status = 'under_review';
        }
        if (cleanSql.includes("status = 'active'") || cleanSql.includes('status = "active"')) {
          updatePayload.status = 'active';
        }
        if (cleanSql.includes("status = 'attended'") || cleanSql.includes('status = "attended"')) {
          updatePayload.status = 'attended';
        }
        if (cleanSql.includes("status = 'cancelled'") || cleanSql.includes('status = "cancelled"')) {
          updatePayload.status = 'cancelled';
        }
        if (cleanSql.includes("account_status = 'active'") || cleanSql.includes('account_status = "active"')) {
          updatePayload.account_status = 'active';
        }
        if (cleanSql.includes("account_status = 'rejected'") || cleanSql.includes('account_status = "rejected"')) {
          updatePayload.account_status = 'rejected';
        }
        if (cleanSql.includes("account_status = 'suspended'") || cleanSql.includes('account_status = "suspended"')) {
          updatePayload.account_status = 'suspended';
        }
        if (cleanSql.includes('is_current = FALSE') || cleanSql.includes('is_current = false')) {
          updatePayload.is_current = false;
        }
        if (cleanSql.includes('is_current = TRUE') || cleanSql.includes('is_current = true')) {
          updatePayload.is_current = true;
        }
        if (cleanSql.includes('votes_count = votes_count + 1')) {
          updatePayload.votes_count = (records[i].votes_count || 0) + 1;
        }
        records[i] = { ...records[i], ...updatePayload };
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      scheduleSaveToDisk();
    }
    return [{ affectedRows: updatedCount }];
  }

  // --- 3. DELETE ---
  if (upperSql.startsWith('DELETE')) {
    const table = targetTable;
    if (memoryDb.tables[table]) {
      const uId = params.userId || params.user_id;
      if (params.id) {
        memoryDb.tables[table] = memoryDb.tables[table].filter((r) => r.id !== params.id);
      } else if (uId) {
        memoryDb.tables[table] = memoryDb.tables[table].filter((r) => r.user_id !== uId && r.userId !== uId && r.id !== uId);
      }
      scheduleSaveToDisk();
    }
    return [{ affectedRows: 1 }];
  }

  // --- 4. SELECT COUNT(*) ---
  if (upperSql.includes('COUNT(*)')) {
    const table = targetTable;
    let list = memoryDb.tables[table] || [];
    if (table === 'notifications') {
      const uid = params.user_id || params.userId;
      if (uid) list = list.filter((r) => r.user_id === uid || r.userId === uid);
      if (cleanSql.includes('read_at IS NULL') || upperSql.includes('READ_AT IS NULL')) {
        list = list.filter((r) => !r.read_at && !r.readAt);
      }
      return [[{ total: list.length, count: list.length }]];
    }
    if (params.id) list = list.filter((r) => r.id === params.id);
    if (params.ministry_id || params.ministryId) {
      const mid = params.ministry_id || params.ministryId;
      list = list.filter((r) => (r.ministry_id && (r.ministry_id === mid || r.ministry_id === 'min-1' && mid === 'intercessory')) || r.id === mid);
    }
    if (params.user_id || params.userId) {
      const uid = params.user_id || params.userId;
      list = list.filter((r) => r.user_id === uid || r.id === uid);
    }
    if (params.status) {
      list = list.filter((r) => r.status === params.status);
    }
    return [[{ total: list.length, count: list.length }]];
  }

  // --- 5. STANDARD SELECT ---
  const table = targetTable;
  let rows = memoryDb.tables[table] || [];

  if (table === 'notifications') {
    const uId = params.userId || params.user_id;
    if (uId) {
      rows = rows.filter((r) => r.user_id === uId || r.userId === uId);
    }
    if (cleanSql.includes('sent_at IS NULL') || upperSql.includes('SENT_AT IS NULL')) {
      rows = rows.filter((r) => !r.sent_at && !r.sentAt);
    }
    // If a user has no notifications yet in memory, provide welcome notifications
    if (rows.length === 0 && uId) {
      const welcomeNotif = {
        id: uuidv4(),
        user_id: uId,
        userId: uId,
        type: 'welcome',
        title: 'Welcome to TUMCU Portal',
        body: 'Your Technical University of Mombasa Christian Union account is active. Explore ministries, fellowship meetings, and Sunday service attendance.',
        channel: 'in_app',
        read_at: null,
        readAt: null,
        sent_at: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      memoryDb.tables.notifications.push(welcomeNotif);
      rows = [welcomeNotif];
    }
    return [
      rows.map((r) => ({
        ...r,
        id: r.id,
        user_id: r.user_id || r.userId,
        userId: r.user_id || r.userId,
        type: r.type || 'welcome',
        title: r.title || 'Welcome to TUMCU!',
        body: r.body || '',
        channel: r.channel || 'in_app',
        read_at: r.read_at || r.readAt || null,
        readAt: r.read_at || r.readAt || null,
        sent_at: r.sent_at || r.sentAt || new Date().toISOString(),
        sentAt: r.sent_at || r.sentAt || new Date().toISOString(),
        created_at: r.created_at || r.createdAt || new Date().toISOString(),
      })),
    ];
  }

  if (table === 'refresh_tokens') {
    const tHash = params.tokenHash || params.token_hash;
    const uId = params.userId || params.user_id;
    if (tHash) {
      rows = rows.filter((r) => r.token_hash === tHash || r.tokenHash === tHash);
    }
    if (uId) {
      rows = rows.filter((r) => r.user_id === uId || r.userId === uId);
    }
    if (cleanSql.includes('revoked_at IS NULL') || upperSql.includes('REVOKED_AT IS NULL')) {
      rows = rows.filter((r) => !r.revoked_at && !r.revokedAt);
    }
    if (cleanSql.includes('expires_at > NOW()') || upperSql.includes('EXPIRES_AT > NOW()')) {
      rows = rows.filter((r) => {
        const exp = r.expires_at || r.expiresAt;
        return !exp || new Date(exp).getTime() > Date.now();
      });
    }
    // Return mapped copies with both snake_case and camelCase
    return [
      rows.map((r) => ({
        ...r,
        id: r.id,
        user_id: r.user_id || r.userId,
        userId: r.user_id || r.userId,
        token_hash: r.token_hash || r.tokenHash,
        tokenHash: r.token_hash || r.tokenHash,
        expires_at: r.expires_at || r.expiresAt,
        expiresAt: r.expires_at || r.expiresAt,
        revoked_at: r.revoked_at || r.revokedAt || null,
        revokedAt: r.revoked_at || r.revokedAt || null,
      })),
    ];
  }

  // Filter by params
  if (params.idOrCode) {
    rows = rows.filter((r) => r.id === params.idOrCode || r.code === params.idOrCode || (r.code && r.code.toLowerCase() === String(params.idOrCode).toLowerCase()));
  }
  if (params.id) {
    if (table === 'ministries' || table === 'committees') {
      rows = rows.filter((r) => r.id === params.id || r.code === params.id || (r.code && r.code.toLowerCase() === String(params.id).toLowerCase()));
    } else if (table === 'users') {
      rows = rows.filter((r) => r.id === params.id || r.email === params.id || r.username === params.id);
    } else {
      rows = rows.filter((r) => r.id === params.id);
    }
  }
  if (params.code) rows = rows.filter((r) => r.code && r.code.toLowerCase() === String(params.code).toLowerCase());
  if (params.email) rows = rows.filter((r) => r.email && r.email.toLowerCase() === String(params.email).trim().toLowerCase());
  if (params.username) rows = rows.filter((r) => r.username && r.username.toLowerCase() === String(params.username).trim().toLowerCase());
  if (params.identifier) {
    const idClean = String(params.identifier).trim();
    const idLower = idClean.toLowerCase();
    const idDigits = idClean.replace(/[^0-9]/g, '');
    rows = rows.filter((r) => {
      const emailMatch = r.email && r.email.toLowerCase() === idLower;
      const userMatch = r.username && r.username.toLowerCase() === idLower;
      const admMatch = r.admission_number && r.admission_number.toLowerCase() === idLower;
      const phoneClean = r.phone_number ? String(r.phone_number).replace(/[^0-9]/g, '') : '';
      const phoneMatch = r.phone_number && (
        r.phone_number.toLowerCase() === idLower ||
        (idDigits.length >= 8 && phoneClean.length >= 8 && phoneClean.slice(-9) === idDigits.slice(-9)) ||
        (idDigits.length >= 7 && phoneClean.length >= 7 && (phoneClean.endsWith(idDigits) || idDigits.endsWith(phoneClean)))
      );
      return emailMatch || userMatch || admMatch || phoneMatch;
    });
  }
  if (params.user_id || params.userId) {
    const uid = params.user_id || params.userId;
    rows = rows.filter((r) => r.user_id === uid || (table === 'users' && r.id === uid));
  }
  if (params.ministry_id || params.ministryId) {
    const mid = params.ministry_id || params.ministryId;
    if (table === 'ministries') {
      rows = rows.filter((r) => r.id === mid || r.code === mid || (r.code && r.code.toLowerCase() === String(mid).toLowerCase()));
    } else {
      rows = rows.filter((r) => r.ministry_id === mid || (params.rawId && r.ministry_id === params.rawId) || (r.ministry_id === 'min-1' && mid === 'intercessory'));
    }
  }
  if (params.status) {
    rows = rows.filter((r) => r.status === params.status);
  }

  // Sorting
  if (upperSql.includes('ORDER BY')) {
    rows = [...rows]; // shallow copy
  }

  // Pagination (LIMIT / OFFSET)
  if (params.limit !== undefined && params.offset !== undefined) {
    const offset = Number(params.offset) || 0;
    const limit = Number(params.limit) || 20;
    rows = rows.slice(offset, offset + limit);
  }

  return [rows];
}

export const pool = {
  async query(sql: string, params: Record<string, any> = {}) {
    if (mysqlPool && !useMemoryStore) {
      try {
        return await mysqlPool.query(sql, params as never);
      } catch (err: any) {
        logger.error({ err: err?.message || err }, 'MySQL query failed.');
        if (env.NODE_ENV === 'production') throw err;
        useMemoryStore = true;
        return executeInMemoryQuery(sql, params);
      }
    }

    return executeInMemoryQuery(sql, params);
  },

  async getConnection() {
    if (mysqlPool && !useMemoryStore) {
      try {
        return await mysqlPool.getConnection();
      } catch (err: any) {
        logger.error({ err: err?.message || err }, 'MySQL connection acquisition failed.');
        if (env.NODE_ENV === 'production') throw err;
        useMemoryStore = true;
      }
    }

    return {
      async query(sql: string, params: Record<string, any> = {}) {
        return executeInMemoryQuery(sql, params);
      },
      async beginTransaction() {},
      async commit() {},
      async rollback() {},
      release() {},
      async ping() {
        return true;
      },
    };
  },
} as unknown as mysql.Pool;

export async function query<T = unknown>(
  sql: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const res = await pool.query(sql, params as never);
  const rows = (res as any)[0] ?? res;
  return rows as T;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!mysqlPool) {
    useMemoryStore = true;
    return env.NODE_ENV !== 'production';
  }

  try {
    const conn = await mysqlPool.getConnection();
    await conn.ping();
    conn.release();
    useMemoryStore = false;
    logger.info('MySQL database connection verified.');
    return true;
  } catch (err: any) {
    logger.error({ err: err?.message || err }, 'MySQL connection unavailable.');
    useMemoryStore = true;
    return env.NODE_ENV !== 'production';
  }
}
