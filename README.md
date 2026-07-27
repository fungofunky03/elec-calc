# ⚡ Elec-Calc

Professional electrical calculations CLI for electricians and electrical engineers.

## Features

- **Voltage Drop Calculations** - Calculate voltage drop for any wire size and distance
- **Conduit Fill** - Check NEC conduit fill limits and size conduit runs  
- **Service Calculations** - Residential and commercial load calculations per NEC 220
- **Ohm's Law Calculator** - V=IR, P=VI calculations with any two known values
- **Wire Sizing** - Size conductors based on ampacity, derating, and continuous loads

## Installation

```bash
npm install
npm run install-global
```

## Usage

### Interactive Mode
```bash
elec
```

### Direct Commands
```bash
elec voltage-drop --current 20 --distance 100 --voltage 120 --wire 12
elec conduit-fill
elec service
elec ohms-law  
elec wire-size
```

## Screenshots

Beautiful terminal UI with:
- Color-coded results
- Professional table formatting
- Warning alerts for code violations
- Comprehensive electrical data tables

## Requirements

- Node.js 18+
- macOS (Silicon optimized)
- Terminal with color support (Ghostty recommended)

## Build Binary

```bash
npm run build
```

Creates a standalone macOS ARM64 binary in `dist/elec-calc-macos`

## License

MIT - Built by electricians, for electricians.