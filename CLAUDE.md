# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Apps Script project for driving agency management, developed with clasp (Command Line Apps Script Projects).

## Development Commands

```bash
# Push local changes to Google Apps Script
clasp push

# Pull changes from Google Apps Script
clasp pull

# Open script in web editor
clasp open
```

## Architecture

- **Runtime**: V8 (configured in `appsscript.json`)
- **Timezone**: Asia/Tokyo
- **Logging**: STACKDRIVER for exception logging
- **Script ID**: Configured in `.clasp.json`
