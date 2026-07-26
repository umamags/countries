// Mirrors the Python safe_slug() used when the country/continent JSON was
// generated (see python/pdf_to_json.py), so a landmark name slugifies the
// same way whether it's turned into a URL here or matched back out of one.
const COMBINING_MARKS = new RegExp('[̀-ͯ]', 'g')

export function slugify(name) {
  const stripped = name.normalize('NFKD').replace(COMBINING_MARKS, '')
  const slug = stripped
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return slug || 'unnamed'
}
