.PHONY: install dev build deploy clean

# Install dependencies for both frontend and backend
install:
	cd backend && npm install
	cd react-frontend && npm install

# Run frontend and backend in development mode
dev:
	# Requires concurrently globally installed or use two terminal tabs
	npx concurrently "cd backend && npm run dev" "cd react-frontend && npm run dev"

# Build the frontend and copy it to backend public directory
build:
	cd react-frontend && npm run build
	mkdir -p backend/public
	cp -r react-frontend/dist/* backend/public/

# Start the full-stack docker compose environment
deploy:
	docker compose up --build -d

# Clean up built assets and node_modules
clean:
	rm -rf react-frontend/dist backend/public
	rm -rf react-frontend/node_modules backend/node_modules
