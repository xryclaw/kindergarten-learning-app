#!/bin/bash
set -e

echo "Installing server dependencies..."
cd server && npm install

echo "✓ Server dependencies installed successfully"
