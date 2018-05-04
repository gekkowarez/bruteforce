# Gekko Warez Bruteforce Backtester

A swiss army nodejs brute force backtester for Gekko trading bot. Saves time so you can spend more time looking good. 

Here's what you can do:

1) Set multiple history periods
2) Set multiple candle sizes
3) Set multiple strategies
4) Set multiple exchange and trading pairs
5) Set random ranges for each strategy config
6) Writes all outputs and strategy configs out into a csv so you can review what strat and related settings are going to make you the most cold hard crypto

Installation:
(You can install Bruteforce wherever you like)

git clone https://github.com/gekkowarez/bruteforce.git
cd bruteforce
npm install

Setup:
Open bruteforce.js and setup paths and configs from line 20. Instructions are in the doc.
If you keep the resultCsv path the same make a "results" folder in the same place you installed the repo.

To run:

You must have the Gekko api server running so type the following into a console:
node gekko --ui 

Then type the following to run the bruteforce app:
node bruteforce.js



