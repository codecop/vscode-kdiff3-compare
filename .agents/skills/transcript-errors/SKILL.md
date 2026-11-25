---
name: transcript-errors
description: > The user dictates messages (speech input), so a garbled message is often a wrong ASR transcript, not a typo. Use this skill when a message looks mis-transcribed: resolve it by sound-alike, context and typical transcript patterns; ask about a transcript error when those rules do not resolve it. Plain typos, letter swaps and umlaut mistakes are handled as usual and are out of scope.
---

# Transcript Errors (Speech Input)

The user writes by voice, so messages can arrive mis-transcribed. A garbled message is usually a transcript error, not a typo.

## Rules (apply in this order)

1. **Sound-alike check.** Could the text be a near-homophone of a sensible word? Classic confusions: v/f, b/p, d/t (German final devoicing: `build` -> `bulid`, `exempt` -> `excemp`), `Bild`/`Build`, and word-segmentation shifts (`ready for review` -> `already for refusals`).
2. **Context check.** Does the literal reading make sense in the conversation? If not, take the reading that fits the context (example from this repo: "roter Bild" meant the red CI badge on GitHub, not a red screen).
3. **Typical transcript patterns.** Dropped function words (`setzen`), mixed DE/EN input with technical terms (`skill md` -> `SKILL.md`, `c-Mokka` -> `cmocka`, `pty smoke`, `vocabulary file`), truncated utterance endings (`ersetze` -> `erszens`).

## Out of scope

Simple typos, letter swaps and umlaut mistakes (`fuhre`/`führe`, `fur`/`für`, `worte`/`Wörter`, `documentes`/`documents`) are corrected in place as usual - no special handling, no question.

## When rules 1-3 do not resolve it

Ask one short question instead of guessing silently, e.g. "War das ein Transkriptfehler - meintest du `ready for review setzen`?"

## Vocabulary file

Keep recurring (misheard -> correct) pairs in [vocabulary.txt](vocabulary.txt) next to this skill (one pair per line, `wrong -> correct`). List only phonetic transcript errors (rules 1-3) - plain typos, letter swaps, umlaut and casing slips are corrected inline and not listed. Seed examples: `requirelements.md -> requirements.md`, `c-Mokka -> cmocka`, `vompilietre -> kompilierte`, `already for refusals -> ready for review setzen`, `Bildsystem -> Buildsystem`.
