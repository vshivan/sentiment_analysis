import os

# Workers — keep low on free tier (512MB RAM)
workers = int(os.environ.get("WEB_CONCURRENCY", 2))
bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"
timeout = 120
preload_app = True          # load app before forking — surfaces startup errors clearly
loglevel = "info"
accesslog = "-"             # stdout
errorlog = "-"              # stderr
capture_output = True       # capture print() statements too
