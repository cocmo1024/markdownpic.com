# Export fidelity check

This file is a **test fixture**, not a saved user draft.

English text, 中文排版, punctuation — “quotes”, and inline math $a^2+b^2=c^2$.

> This quote, including its left border, must match the exported image.

## A compact table

| Format | Detail | Intended result |
| --- | --- | --- |
| PNG | Sharp text | No crop |
| JPEG | Smaller photos | Correct background |
| WebP | Modern compression | Correct file type |

- [x] A checked task
- [ ] An unchecked task

~~~javascript
const message = "Markdown stays editable.";
console.log(message);
// <!-- page --> is code, not a page break.
~~~

$$
A = P(1+r)^t
$$

~~~mermaid
flowchart LR
  A[Write] --> B[Preview]
  B --> C[Export]
~~~

**BOTTOM SENTINEL — must appear completely in the exported image.**
