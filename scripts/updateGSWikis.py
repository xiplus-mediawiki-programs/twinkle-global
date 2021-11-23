import os

import requests

BASEDIR = os.path.dirname(os.path.abspath(__file__))

headers = {
    'user-agent': 'Twinkle script [[User:Xiplus]]'
}

data = {
    'action': 'query',
    'format': 'json',
    'list': 'wikisets',
    'wsfrom': 'Opted-out of global sysop wikis',
    'wsprop': 'wikisnotincluded',
    'wslimit': '1'
}
r = requests.post('https://meta.wikimedia.org/w/api.php', data=data, headers=headers)
try:
    result = r.json()
except Exception as e:
    print(e)
    print(r.text)
    exit()

if result['query']['wikisets'][0]['id'] != '7' or result['query']['wikisets'][0]['name'] != 'Opted-out of global sysop wikis':
    print('API error')
    exit()

fullFilename = os.path.join(BASEDIR, '..', 'morebits.js')

with open(fullFilename, 'r', encoding='utf8') as f:
    jsText = f.read()

FLAG1 = 'MorebitsGlobal.nonGSWikis = [\n'
FLAG2 = ']; // end of nonGSWikis'
try:
    pos1 = jsText.index(FLAG1) + len(FLAG1)
    pos2 = jsText.index(FLAG2)
except ValueError:
    print('Flag not found')
    exit()

allText = ''
for wiki in result['query']['wikisets'][0]['wikisnotincluded'].values():
    allText += "\t'{}',\n".format(wiki)

jsText = jsText[:pos1] + allText + jsText[pos2:]

with open(fullFilename, 'w', encoding='utf8') as f:
    f.write(jsText)
