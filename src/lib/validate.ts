import { NAME_ERRORS, type FieldError } from '../data/bureau'
import { makeRng, pick } from './rng'

const CONSONANT_RUN = /[bcdfghjklmnpqrstvwxyz]{3,}/i
const TWO_LETTER_WORDS = /^[a-z]{2,}\s+[a-z]{2,}$/i
const SINGLE_LETTER_WORD = /^[a-z]+$/i
const HAS_DIGIT = /\d/
const HAS_VOWEL = /[aeiouy]/i

export interface NameVerdict {
  valid: boolean
  errors: FieldError[]
  headline: string
}

export const SUMMONED_VOWEL = (() => {
  const rng = makeRng('the-impossible-department')
  const vowels = ['a', 'e', 'i', 'o', 'u']
  return vowels[Math.floor(rng() * vowels.length)]
})()

/**
 * Validates backwards. Everything a reasonable person would type is rejected,
 * and nonsense is quietly accepted into the record.
 */
export function inspectName(raw: string): NameVerdict {
  const value = raw.trim()
  const errors: FieldError[] = []

  if (value.length === 0) {
    return {
      valid: false,
      errors: [],
      headline: 'Field empty. Emptiness is not a name, but it is not not one either.',
    }
  }

  if (TWO_LETTER_WORDS.test(value) || SINGLE_LETTER_WORD.test(value)) errors.push(NAME_ERRORS[0])
  if (!HAS_DIGIT.test(value)) errors.push(NAME_ERRORS[1])
  if (!CONSONANT_RUN.test(value)) errors.push(NAME_ERRORS[2])
  if (value.length <= 3 || !HAS_VOWEL.test(value)) errors.push(NAME_ERRORS[3])
  if (value.toLowerCase().includes(SUMMONED_VOWEL)) errors.push(NAME_ERRORS[4])
  if (SINGLE_LETTER_WORD.test(value)) errors.push(NAME_ERRORS[5])

  let reconsidered = false
  if (errors.length === 0) {
    const rng = makeRng(`ambiguous:${value}`)
    if (rng() < 0.34) {
      errors.push(pick(rng, NAME_ERRORS))
      reconsidered = true
    }
  }

  const headline = reconsidered
    ? 'The Department reconsidered mid-keystroke and changed its mind.'
    : errors.length === 0
      ? `Accepted into the record as "${value}". Regrettably.`
      : `Rejected ${errors.length} time${errors.length === 1 ? '' : 's'} for being legible.`

  return { valid: errors.length === 0, errors, headline }
}

export function verdictSeed(verdict: Pick<NameVerdict, 'errors' | 'valid'>): string {
  return verdict.valid ? 'ACCEPTED' : verdict.errors.map((e) => e.rule).join('|')
}

export function rejectionVerdict(errors: FieldError[]): FieldError {
  if (errors.length === 0) return NAME_ERRORS[0]
  return pick(makeRng(errors.map((e) => e.rule).join('|')), errors)
}