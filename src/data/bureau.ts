/** The official lexicon of The Impossible Department. Nothing here is true. */

export const TAGLINES = [
  'The form you did not file has been filed by your absence.',
  'Your application is approved, expired, and under review.',
  'This page is loading and has already finished loading.',
  'We have reviewed your request before you submitted it.',
  'Your reference number is a number that has not been issued.',
  'You are already in the queue. You are also not in the queue.',
  'The deadline is tomorrow, which has not been scheduled.',
  'You have been waiting 3 weeks. The 3 weeks have not started.',
] as const

export const AGENCY_NAMES = [
  'Division of Unresolved Mathematics',
  'Bureau of Impossible Geometry',
  'Office of Things Already Forgotten',
  'Registry of Persons Who Are Not Present',
  'Committee for the Gentle Rejection',
  'Department of Almosts',
] as const

export interface FieldRule {
  id: string
  label: string
  hint: string
  /** Text that the Department has declared illegible. */
  rejects: string[]
  /** Text that the Department has inexplicably accepted. */
  accepts: string[]
}

export const NAME_RULES = [
  'Must not resemble a name',
  'Must contain at least one digit',
  'Must contain three consecutive consonants',
  'Must not contain a vowel that has been summoned',
  'Must be pronounceable by no living person',
] as const

export const REJECTION_REASONS = [
  'Other',
  'Other (as specified above)',
  'The reason you gave is not the reason you gave',
  'You failed to fail correctly',
  'Insufficient proof of insufficient proof',
  'Approved under protest',
  'Previously denied on grounds now removed',
] as const

export interface FieldError {
  rule: string
  detail: string
}

export const NAME_ERRORS: FieldError[] = [
  { rule: 'Reg. 1 — Illegibility of Names', detail: 'That was suspiciously name-shaped. Try harder to be anonymous.' },
  { rule: 'Reg. 4 — Digital Persons', detail: 'A legal name contains no digits. Yours contained one.' },
  { rule: 'Reg. 7 — Consonant Clusters', detail: 'Three consonants in a row. Our typists have filed a complaint.' },
  { rule: 'Reg. 9 — Unpronounceable Persons', detail: 'No living person can say that out loud, and we are all living.' },
  { rule: 'Reg. 11 — Vowel Summoning', detail: 'That vowel has been recalled. Choose a different vowel.' },
  { rule: 'Reg. 13 — Anonymity Minimums', detail: 'You are required to be illegible. You are too legible.' },
]

export const PARADOX_ERRORS = [
  { code: 'ERR-0001', message: 'Cannot submit: form is already submitted. Also, form is not submitted.' },
  { code: 'ERR-0000', message: 'Success. Success is unavailable.' },
  { code: 'ERR-∞', message: 'Division by zero was performed successfully.' },
  { code: 'ERR-404', message: 'Your application was found. It is not here.' },
  { code: 'ERR-200', message: 'Rejected for being accepted.' },
  { code: 'ERR-∩', message: 'You belong to two mutually exclusive branches. Both are pending.' },
  { code: 'ERR-∅', message: 'Set is empty. The set is full. The set has left.' },
  { code: 'ERR-42', message: 'The answer is withheld from you specifically.' },
] as const

export interface Prophecy {
  subject: string
  claim: string
  caveat: string
}

const SUBJECTS = [
  'Your next form',
  'This sentence',
  'The window you are about to close',
  'Your patience',
  'The queue below',
  'Your username',
  'The last thing you searched for',
  'Whatever you were about to type and did not',
  'The loading spinner',
  'Your unanswered messages',
] as const

const CLAIMS = [
  'will be rejected for a reason that arrives before you commit it',
  'is simultaneously the first and last instance of itself',
  'was filed under your name before you were born',
  'will succeed, and success will be considered suspicious',
  'does not exist, and its absence is also pending',
  'has been approved in a jurisdiction you have not visited',
  'will arrive slightly before you decide to need it',
  'was, in fact, the other one',
] as const

const CAVEATS = [
  'This prophecy voids itself upon being read aloud.',
  'Valid only in the vertical column it was printed in.',
  'Expires the moment you scroll past it.',
  'Subject to retroactive amendment.',
  'Requires a witness who is currently asleep.',
  'Superseded by a prophecy issued to someone else.',
  'Cannot be cited in the document it applies to.',
  'Void where the reader is having a good day.',
] as const

export interface QueueItem {
  id: number
  ref: string
  subject: string
  age: string
  status: 'IN REVIEW' | 'DENIED' | 'APPROVED (PENDING)' | 'AWAITING AWAITING' | 'ESCALATED'
  note: string
}

export const QUEUE_NOTES = [
  'Moved to the front of the queue at position 0, behind position 0.',
  'Signed by a clerk who is currently on this form.',
  'Attached: 4 pages, 3 of which are the same page.',
  'Received after the deadline, which was yesterday.',
  'Forwarded to itself, and it declined.',
  'Escalated to the department directly above it.',
  'Held pending a ruling on a ruling that is pending.',
  'Return sender is listed as "The Future Office".',
  'Held in abeyance, in absentia, and in general.',
] as const

export const QUEUE_SUBJECTS = [
  'Application for one (1) ordinary afternoon',
  'Request to be mildly surprised',
  'Appeal of the ruling on the appeal of the ruling',
  'Claim for the return of a Tuesday',
  'Registration of an emotion, unnamed',
  'Notice of intent to consider an intention',
  'Declaration that a door was closed politely',
  'Licence to be slightly late, backdated',
  'Permit for a shadow that has outgrown its owner',
  'Certificate of non-participation',
] as const

export const CLAUSE_MERITS = [
  'Is approved on the grounds that it was rejected.',
  'Cannot be denied, because denial requires a valid submission.',
  'Is automatically escalated upon being approved.',
  'Refers to itself, which is not permitted.',
  'Is enclosed within its own envelope, which is also this sentence.',
  'Expires simultaneously with the moment it begins.',
  'Binds only parties who are not currently reading it.',
  'Shall take effect on the day it was repealed.',
] as const

export function buildProphecy(rng: () => number, pick: <T>(r: () => number, i: readonly T[]) => T): Prophecy {
  return {
    subject: pick(rng, SUBJECTS),
    claim: pick(rng, CLAIMS),
    caveat: pick(rng, CAVEATS),
  }
}

export function buildQueueItem(rng: () => number, id: number, pick: <T>(r: () => number, i: readonly T[]) => T): QueueItem {
  const ref = `${String(Math.floor(rng() * 9) + 1)}X/${String(id).padStart(5, '0')}/${pick(rng, ['Q', 'Q', 'R', 'ZZ', 'Ø'] as const)}`
  const years = Math.floor(rng() * 40)
  const age = years === 0 ? `${Math.floor(rng() * 11)} minutes ago` : `${years} years ago`
  return {
    id,
    ref,
    subject: pick(rng, QUEUE_SUBJECTS),
    age,
    status: pick(rng, ['IN REVIEW', 'DENIED', 'APPROVED (PENDING)', 'AWAITING AWAITING', 'ESCALATED'] as const),
    note: pick(rng, QUEUE_NOTES),
  }
}