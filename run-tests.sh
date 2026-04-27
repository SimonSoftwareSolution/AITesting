#!/bin/bash
cd ~/repos/AITesting
export PATH="/Users/simon/.nvm/versions/node/v24.14.0/bin:$PATH"
npm test >> ~/repos/AITesting/test-run.log 2>&1
