# Security Report

## Known Vulnerabilities (2026-02-11)

### xlsx library
**Severity**: High
**Status**: Known and accepted (low risk in our context)

**Vulnerabilities**:
- Prototype Pollution in sheetJS (GHSA-4r6h-8v6p-xvw6)
- SheetJS Regular Expression Denial of Service (GHSA-5pgg-2g8v-p4x9)

**Our Usage**:
We only use xlsx for **generating** Excel files (write operation), never for parsing user-uploaded files. The vulnerabilities affect input parsing, not output generation, so the risk is minimal in our use case.

**Mitigation**:
- No user file uploads are processed
- Library is only used server-side for report generation
- Input data is sanitized from database queries

**No fix available** as of 2026-02-11. Monitoring for updates.

---

## Security Best Practices

### Authentication
- Supabase Auth handles all authentication
- Row Level Security (RLS) enabled on all tables
- Two roles: `user` (operators) and `superuser` (admins)

### Environment Variables
- All secrets stored in Vercel environment variables
- Never committed to repository
- Encrypted at rest

### Database
- RLS policies enforce user-level permissions
- Supabase service role key only used server-side
- Public anon key rate-limited by Supabase

### API Security
- Protected by Next.js middleware (proxy)
- Authenticated users only
- No public API endpoints
