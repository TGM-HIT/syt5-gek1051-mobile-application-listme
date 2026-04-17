#!/usr/bin/env bash
# Bootstrap the Gradle wrapper (run once after cloning).
# Requires Gradle 8.9 to be installed locally, OR just open in Android Studio
# which downloads everything automatically.

set -e
cd "$(dirname "$0")"

if command -v gradle &> /dev/null; then
    gradle wrapper --gradle-version 8.9
    echo "✓ Gradle wrapper generated. Run ./gradlew assembleDebug to build."
else
    echo "Gradle not found locally."
    echo "→ Open this folder in Android Studio — it will set up the wrapper automatically."
    echo "→ Or install Gradle 8.9: https://gradle.org/install/"
fi
