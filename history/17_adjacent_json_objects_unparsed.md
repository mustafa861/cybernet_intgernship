# Prompt

**User:** When I instructed the AI to create the categories rent, electricity, and internet, it returned three independent JSON objects delimited by newlines rather than a properly formatted JSON array — that is, `{...}\n{...}\n{...}` instead of `[{...}, {...}, {...}]`. Consequently, the `_parse_tool_calls` function failed to recognise these as tool invocations, bypassed execution entirely, and rendered the raw JSON as plain text in the conversational output. Please extend the parser to accommodate this adjacent-object format.

---

## Response

**OpenCode:** Augmented `_parse_tool_calls()` with a linewise fallback parser that activates after the primary JSON-parse and code-block-extraction strategies have both been exhausted. This fallback:
1. Splits the response string by newlines
2. Strips whitespace from each line
3. Attempts `json.loads()` on every non-empty line independently
4. Collects all lines that successfully parse into dictionaries containing both `"tool"` and `"arguments"` keys
5. Returns the complete collection if any valid tool calls were discovered

Additionally corrected `_strip_tool_block()` to remove *all* occurrences of tool JSON patterns (removed the `count=1` restriction from the regex), preventing residual object literals from contaminating the conversational text output.
