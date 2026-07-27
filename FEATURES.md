# 🔌 Elec-Calc Features

## Electrical Calculation Features

### ⚡ Voltage Drop Calculator
- Supports all standard wire sizes (14 AWG to 1000 kcmil)
- Single and three-phase calculations
- Power factor considerations
- Automatic warnings for NEC violations (>3%, >5%)
- Distance, current, voltage, and wire size inputs

### 🔧 Conduit Fill & Sizing
- Bundled conduit table lookup for supported conduit types
- Check existing conduit/wire combinations
- Size conduit for given wire count
- Interactive fill percentage tables
- EMT coverage from 1/2" to 4"

### 🏠 Service Entrance Calculations
- **Residential**: Simplified dwelling load estimates
  - General lighting (3 VA/sq ft)
  - Small appliance and laundry circuits
  - Simplified range and dryer demand factors
  - HVAC and water heater loads
  - Automatic service size recommendation

- **Commercial**: Basic demand estimates
  - Connected load vs demand load
  - Industry-specific demand factors
  - 480V three-phase calculations

### ⚙️ Ohm's Law Calculator
- Solve for any unknown: V, I, R, P
- All standard formulas: V=IR, P=VI, P=I²R, P=V²/R
- Smart input validation
- Clear formula display

### 📏 Wire Sizing Calculator
- Load-based ampacity calculations
- Temperature derating factors
- Continuous load multipliers (125%)
- Multiple conductor derating
- Recommendation with safety margins

## Terminal UI Features
- **Beautiful colors** - Professional terminal styling
- **Interactive menus** - Easy navigation with arrow keys  
- **Smart warnings** - Code violation alerts
- **Formatted tables** - Clean data presentation
- **Boxed results** - Highlighted calculation outputs
- **Progress indicators** - Visual feedback

## Usage Modes
- **Interactive CLI** - Menu-driven interface
- **Direct commands** - Scriptable single calculations
- **Standalone binary** - No Node.js required for end users

## Platform Support
- **macOS Silicon** - Native ARM64 binary
- **Ghostty Terminal** - Optimized for modern terminal emulators
- **Cross-platform** - Works on any Node.js environment

## Professional Features
- **Reference-driven outputs** - Based on bundled wire and conduit tables
- **Real-world data** - Industry-standard wire tables plus supported conduit tables
- **Safety margins** - Built-in recommendations for oversizing
- **Multiple standards** - Supports various temperature ratings and conditions

Perfect for:
- Electrical contractors
- Electricians in the field  
- Engineering students
- Code inspectors
- Anyone doing electrical calculations