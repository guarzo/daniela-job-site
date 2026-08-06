/* Fixture data for the local render harness. Invented companies and roles only —
 * nothing here describes a real application, and the directory is outside public/
 * so it is never uploaded. Shaped to stress the layout rather than to look tidy:
 *
 *   - every one of the ten statuses appears at least once
 *   - company and role strings run from 3 to 58 characters
 *   - rows exist with no CV, no cover letter, neither, and both
 *   - fit runs 0 / null / low / high so the fit cell is exercised at both ends
 *   - pending and settled signals, including a superseded pair
 */
window.FIXTURES = {
  applications: [
    // --- drafted: the queue band ---
    { id: 'a1', company: 'Northwind Freight', role: 'Senior Operations Analyst', status: 'drafted', status_date: '2026-08-04', fit_rating: 84.2, notes: 'Recruiter reached out first. Salary band published.', cv_object: 'cv/a1.pdf', cover_letter_object: 'cl/a1.pdf' },
    { id: 'a2', company: 'Bellweather Systems GmbH', role: 'Product Operations Lead, Platform & Developer Experience', status: 'drafted', status_date: '2026-08-04', fit_rating: 79.8, notes: null, cv_object: 'cv/a2.pdf', cover_letter_object: 'cl/a2.pdf' },
    { id: 'a3', company: 'Verrata Mobility', role: 'Program Manager', status: 'drafted', status_date: '2026-08-03', fit_rating: 78.2, notes: 'Hybrid, two days on site.', cv_object: 'cv/a3.pdf', cover_letter_object: null },
    { id: 'a4', company: 'FRS', role: 'Business Analyst', status: 'drafted', status_date: '2026-08-03', fit_rating: 68.8, notes: null, cv_object: null, cover_letter_object: null },
    { id: 'a5', company: 'Affirmis', role: 'Strategy Associate', status: 'drafted', status_date: '2026-08-02', fit_rating: 66.9, notes: null, cv_object: 'cv/a5.pdf', cover_letter_object: 'cl/a5.pdf' },
    { id: 'a6', company: 'Quillon Health Partners', role: 'Operations Manager', status: 'drafted', status_date: '2026-08-02', fit_rating: null, notes: null, cv_object: 'cv/a6.pdf', cover_letter_object: 'cl/a6.pdf' },

    // --- sent: the history band, one row per status treatment ---
    { id: 'b1', company: 'Halberd Logistics', role: 'Regional Operations Lead', status: 'applied', status_date: '2026-07-30', fit_rating: 81.0, notes: null, cv_object: 'cv/b1.pdf', cover_letter_object: 'cl/b1.pdf' },
    { id: 'b2', company: 'Meridian Grove', role: 'Senior Program Manager', status: 'interview', status_date: '2026-07-28', fit_rating: 88.4, notes: 'Second round scheduled.', cv_object: 'cv/b2.pdf', cover_letter_object: 'cl/b2.pdf' },
    { id: 'b3', company: 'Cassava Analytics', role: 'Head of Operations', status: 'offer', status_date: '2026-07-26', fit_rating: 91.2, notes: 'Offer in writing, one week to respond.', cv_object: 'cv/b3.pdf', cover_letter_object: 'cl/b3.pdf' },
    { id: 'b4', company: 'Ostara Labs', role: 'Operations Director', status: 'hired', status_date: '2026-07-24', fit_rating: 93.7, notes: null, cv_object: 'cv/b4.pdf', cover_letter_object: 'cl/b4.pdf' },
    { id: 'b5', company: 'Pellucid Retail Group', role: 'Analyst', status: 'rejected', status_date: '2026-07-22', fit_rating: 55.1, notes: null, cv_object: 'cv/b5.pdf', cover_letter_object: null },
    { id: 'b6', company: 'Tanager Industrial', role: 'Supply Chain Coordinator', status: 'no_response', status_date: '2026-07-18', fit_rating: 61.3, notes: 'Six weeks, nothing.', cv_object: 'cv/b6.pdf', cover_letter_object: 'cl/b6.pdf' },
    { id: 'b7', company: 'Wrenfield & Co', role: 'Principal Consultant', status: 'offer_declined', status_date: '2026-07-15', fit_rating: 72.0, notes: null, cv_object: 'cv/b7.pdf', cover_letter_object: 'cl/b7.pdf' },
    { id: 'b8', company: 'Solvent Bay', role: 'Operations Partner', status: 'interview_only', status_date: '2026-07-11', fit_rating: 64.5, notes: null, cv_object: 'cv/b8.pdf', cover_letter_object: 'cl/b8.pdf' },
    { id: 'b9', company: 'Ilex', role: 'Chief of Staff to the Chief Operating Officer', status: 'withdrawn', status_date: '2026-07-08', fit_rating: 0, notes: 'Withdrew after the second call.', cv_object: null, cover_letter_object: 'cl/b9.pdf' },
    { id: 'b10', company: 'Karnak Freightways International Holdings', role: 'Senior Manager, Network Planning', status: 'applied', status_date: '2026-07-05', fit_rating: 70.4, notes: null, cv_object: 'cv/b10.pdf', cover_letter_object: 'cl/b10.pdf' },
  ],

  /* The set above stresses the layout. This one reproduces its everyday shape, which
   * turned out to be the harder case and the one the stress set was hiding: every row
   * drafted, every row carrying a note, every role long enough to wrap, and nothing
   * sent yet so the history band is empty. Companies and roles are invented; the
   * proportions are what matter. Reached with ?today. */
  today: [
    { id: 't1', company: 'Nolan Transportation Group (NTG)', role: 'Vice President of Strategic Customer Accounts', status: 'drafted', status_date: '2026-08-05', fit_rating: 84.2, notes: 'Recruiter reached out first. Salary band published.', cv_object: 'cv/t1.pdf', cover_letter_object: 'cl/t1.pdf' },
    { id: 't2', company: 'Teamviewly', role: 'Vice President, Global Enterprise Customer Success', status: 'drafted', status_date: '2026-08-05', fit_rating: 79.8, notes: 'Remote, but the team sits in Munich.', cv_object: 'cv/t2.pdf', cover_letter_object: 'cl/t2.pdf' },
    { id: 't3', company: 'Verrata Mobility', role: 'Strategic Director of Account Management', status: 'drafted', status_date: '2026-08-04', fit_rating: 78.2, notes: 'Hybrid, two days on site.', cv_object: 'cv/t3.pdf', cover_letter_object: 'cl/t3.pdf' },
    { id: 't4', company: 'FRS', role: 'Sr Director, Client Success - Strategic Accounts (North America)', status: 'drafted', status_date: '2026-08-04', fit_rating: 68.8, notes: 'Posting has been open eleven weeks.', cv_object: 'cv/t4.pdf', cover_letter_object: 'cl/t4.pdf' },
    { id: 't5', company: 'Affirmis', role: 'Director, Platform Accounts Management', status: 'drafted', status_date: '2026-08-03', fit_rating: 66.9, notes: 'Second posting from them this month.', cv_object: 'cv/t5.pdf', cover_letter_object: 'cl/t5.pdf' },
  ],

  /* Ordered created_at ascending, matching the real query. a1 carries an unprocessed
   * signal (pending ground). b2 carries a superseded pair: the hold came first, the
   * sent supersedes it. b1's signal is already picked up, so its row sits settled —
   * that contrast is the whole point of the sunk ground and needs to be visible. */
  viewer_signals: [
    { id: 's1', application_id: 'b2', kind: 'hold', note: null, created_at: '2026-07-27T09:00:00Z', processed_at: '2026-07-27T10:00:00Z' },
    { id: 's2', application_id: 'b2', kind: 'sent', note: null, created_at: '2026-07-27T11:00:00Z', processed_at: '2026-07-27T12:00:00Z' },
    { id: 's3', application_id: 'b1', kind: 'note', note: 'Followed up by email.', created_at: '2026-07-30T08:00:00Z', processed_at: '2026-07-30T09:00:00Z' },
    { id: 's4', application_id: 'a1', kind: 'sent', note: null, created_at: '2026-08-05T08:00:00Z', processed_at: null },
    { id: 's5', application_id: 'a3', kind: 'hold', note: 'Wait until the salary question is answered.', created_at: '2026-08-05T09:00:00Z', processed_at: null },
  ],
};
