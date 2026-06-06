import sys
import os

# Add backend/app to path to ensure modules are discoverable
sys.path.append(os.path.join(os.getcwd(), 'backend', 'app'))

from main import app
