from crontab import CronTab
from datetime import datetime

my_cron=CronTab(user='zqian')
# remove all jobs
my_cron.remove_all()
#job = my_cron.new(command='python /Users/zqian/Documents/bio_code_django/meme_script/testMoca.py')
#job.minute.every(1)
my_cron.write()
