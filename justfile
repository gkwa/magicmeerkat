# Default recipe
default: build

# Install dependencies
setup:
    pnpm init
    pnpm add -D vite@latest

# Create necessary directories
create-dirs:
    mkdir -p dist

# Clean the dist directory
clean:
    rm -rf dist/*

# Build the extension using vite
build: clean create-dirs
    echo "Building background script..."
    pnpm build --mode background
    echo "Building content script..."
    pnpm build --mode content
    echo "Listing dist directory:"
    ls -la dist/

# Copy static assets
copy-assets:
    echo "Copying manifest and icons..."
    cp manifest.json dist/ || echo "Failed to copy manifest.json"
    cp icon*.png dist/ || echo "Failed to copy icons"
    echo "Final dist contents:"
    ls -la dist/

# Full build including assets
build-full: build copy-assets

# Create a zip file for distribution
package: build-full
    cd dist && zip -r ../extension.zip ./*

# Install locally for testing
install-local: build-full
    if [ -d "$(HOME)/.config/google-chrome/Default/Extensions/magicmeerkat" ]; then \
        rm -rf "$(HOME)/.config/google-chrome/Default/Extensions/magicmeerkat"; \
    fi
    mkdir -p "$(HOME)/.config/google-chrome/Default/Extensions/magicmeerkat"
    cp -r dist/* "$(HOME)/.config/google-chrome/Default/Extensions/magicmeerkat/"
