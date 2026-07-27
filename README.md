# ⚡ Elec-Calc

Electrical calculations CLI for electricians and electrical engineers.

## Features

- **Voltage Drop Calculations** - Calculate voltage drop for any wire size and distance
- **Conduit Fill** - Check bundled conduit fill tables and size conduit runs
- **Service Calculations** - Residential and commercial service load estimates
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
elec voltage-drop --current 20 --distance 100 --voltage 480 --wire 12 --phase three
elec conduit-fill --mode check --conduit-type EMT --conduit-size 1 --wire 12 --count 12
elec service --mode commercial --connected-load 125 --demand-factor 0.65
elec ohms-law --voltage 120 --current 2
elec wire-size --current 24 --continuous 1.25
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

## Scope Notes

- The bundled conduit reference data currently supports EMT fully and a limited RMC sample table.
- Residential and commercial service outputs are simplified estimates, not a substitute for a full code review.
- Voltage drop uses conductor resistance tables and supports single-phase and three-phase calculations.

## Testing

```bash
npm test
```

## Build Binary

```bash
npm run build
```

Creates a standalone macOS ARM64 binary in `dist/elec-calc-macos`

## License

MIT - Built by electricians, for electricians.