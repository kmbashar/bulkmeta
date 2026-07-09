# Security Policy

## Reporting Security Issues

If you discover a security vulnerability in BulkMeta, please do **not** open a public issue. Instead, please email the maintainers directly.

### What to Include

When reporting a security vulnerability, please include:

1. Description of the vulnerability
2. Steps to reproduce (if possible)
3. Potential impact
4. Suggested fix (if you have one)

## Security Considerations

BulkMeta is a Webflow Designer Extension that:

- Runs **inside the Webflow Designer interface** (not a standalone service)
- Uses **Webflow's official Designer Extension API** for all page modifications
- Does **not** store data on external servers
- Does **not** require API keys or authentication beyond Webflow access
- Handles only **SEO and Open Graph metadata** (no sensitive user data)

## Best Practices for Users

- Keep BulkMeta updated to the latest version
- Use BulkMeta only within the official Webflow Designer
- Do not modify the extension files or code outside of this repository
- Report suspicious behavior to the maintainers

## Supported Versions

Security updates are provided for the latest stable release. Users are encouraged to upgrade to the latest version.

Thank you for helping keep BulkMeta secure! 🔒
