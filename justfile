# Default recipe
default: build

# Install dependencies
setup:
    pnpm add -D vite@latest

# Create necessary directories
create-dirs:
    mkdir -p dist

# Clean the dist directory
clean:
    rm -rf dist/*

# Build the extension using vite
build: clean create-dirs
    pnpm build

# Watch for changes and rebuild
dev: clean create-dirs
    pnpm dev

# Copy static assets
copy-assets:
    cp manifest.json dist/
    cp icon*.png dist/

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
