#!/bin/bash

# Build script for elec-calc macOS binary

echo "🔌 Building elec-calc for macOS Silicon..."

# Install pkg if not present
if ! command -v pkg &> /dev/null; then
    echo "Installing pkg..."
    npm install -g pkg
fi

# Create dist directory
mkdir -p dist

# Build the binary
pkg src/index.js --targets node18-macos-arm64 --output dist/elec-calc-macos

echo "✅ Build complete! Binary created at: dist/elec-calc-macos"
echo "📱 Test it: ./dist/elec-calc-macos --help"
echo "🚀 Install it: cp dist/elec-calc-macos /usr/local/bin/elec"