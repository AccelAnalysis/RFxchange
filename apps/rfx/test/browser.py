"""Focused shell tests. All business data and map SDK are explicit test doubles.
Run: python -m pip install playwright; python test/browser.py
No live Firebase reads, provider requests, email, SMS, or payments.
"""
import functools, http.server, json, os, pathlib, threading
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=pathlib.Path(os.environ.get('RFX_BROWSER_OUTPUT',str(ROOT/'test-output')));OUT.mkdir(parents=True,exist_ok=True)
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT/'public')))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
MAP_STUB="""window.mapInstances=0;window.mapboxgl={Map:class{constructor(){window.mapInstances++;this.sources={};this.layers={};setTimeout(()=>{this.emit('style.load');this.emit('load')},20)}on(name,a,b){if(typeof a==='function')(this.events??={})[name]=a;return this}emit(name){this.events?.[name]?.()}isStyleLoaded(){return true}addSource(id,s){this.sources[id]={...s,setData(data){this.data=data}}}getSource(id){return this.sources[id]}removeSource(id){delete this.sources[id]}addLayer(x){this.layers[x.id]=x}getLayer(id){return this.layers[id]}removeLayer(id){delete this.layers[id]}setFilter(){}setLayoutProperty(){}jumpTo(){}easeTo(){}resize(){}setStyle(){this.emit('style.load')}}};"""
items=[{'id':f'organization:test-{i}','organizationId':f'test-{i}','kind':'organization','title':f'Test organization {i}', 'subtitle':'Test data only','location':'Authorized test locality','summary':'Synthetic capability summary for browser acceptance.','coordinate':[-76.3+i*.01,36.85],'tags':['Test capability'],'facts':[['Evidence','Browser test fixture']], 'href':'https://rfxchange--rfxchange.us-east4.hosted.app/organization-profile'} for i in range(8)]
report={'kind':'local-browser-test','data':'synthetic test fixtures; Mapbox SDK double','screens':[],'checks':[]}
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    context=browser.new_context(service_workers='block',reduced_motion='reduce')
    context.add_init_script(MAP_STUB)
    requests=[]
    def handle(route):
        u=route.request.url
        if '/runtime-config.json' in u: route.fulfill(json={'configured':False,'firebase':{},'mapboxToken':'test-map-token','purchasingOrigin':'https://rfxchange-purchasing.web.app','exchangeOrigin':'https://rfxchange--rfxchange.us-east4.hosted.app'})
        elif '/api/exchange/media' in u: route.fulfill(json={'video':None,'poster':None})
        elif '/api/exchange?' in u:
            requests.append(u)
            lens=u.split('lens=')[1].split('&')[0]
            route.fulfill(json={'viewer':{'id':'test-viewer','membershipId':'test-member','organizationId':'test-org','name':'Test organization'},'geography':{'id':'test-geography','name':'TEST DATA · NOT LIVE'},'home':{'coordinate':[-76.3,36.85],'label':'Test organization'},'boundaries':[],'items':items,'nextCursor':None,'total':len(items),'lens':lens})
        elif '/api/auth/session' in u: route.fulfill(json={'signedOut':True})
        elif not u.startswith(base): route.abort()
        else: route.continue_()
    context.route('**/*',handle)
    page=context.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    for name,w,h in [('mobile',390,844),('landscape',844,390),('desktop',1440,900)]:
        page.set_viewport_size({'width':w,'height':h});page.goto(base+'/?lens=intelligence');page.wait_for_selector('.result-card');page.wait_for_timeout(100)
        assert page.locator('.bottom-nav > *').count()==5
        assert page.locator('#menu-toggle').count()==1
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert page.locator('.mapboxgl-ctrl-zoom-in').count()==0
        assert page.locator('#query').input_value()==''
        capsule=page.locator('#search-form').bounding_box();nav=page.locator('.bottom-nav').bounding_box();assert capsule['x']>=0 and capsule['x']+capsule['width']<=w+1;assert nav['x']>=0 and nav['x']+nav['width']<=w+1
        if name=='mobile':
            page.locator('#drag-handle').focus();page.keyboard.press('End');assert page.locator('#sheet').get_attribute('data-snap')=='expanded'
        assert page.evaluate('window.mapInstances')==1
        page.screenshot(path=str(OUT/f'{name}.png'))
        page.locator('#filter-toggle').click();assert page.locator('#filters').evaluate('(n)=>n.open');page.screenshot(path=str(OUT/f'{name}-filters.png'));page.keyboard.press('Escape');assert not page.locator('#filters').evaluate('(n)=>n.open')
        page.locator('#map-toggle').click();assert page.locator('#map-options').evaluate('(n)=>n.open');page.keyboard.press('Escape')
        for lens in ['resources','rfx','capabilities','intelligence']:
            page.locator(f'[data-lens={lens}]').click();page.wait_for_selector('.result-card');assert page.locator(f'[data-lens={lens}]').get_attribute('aria-current')=='page';assert page.evaluate('window.mapInstances')==1
        if name=='mobile': page.locator('#drag-handle').focus();page.keyboard.press('End')
        page.locator('.card-open').first.click();assert page.locator('#detail').is_visible();page.locator('.detail-back').click();assert not page.locator('#detail').is_visible();assert page.locator('#result-list').is_visible()
        report['screens'].append({'viewport':name,'size':[w,h],'overflow':False,'mapInstances':page.evaluate('window.mapInstances')})
    report['checks']=['five navigation items','single menu','segmented search','no mobile zoom stack','no horizontal overflow','dialog open/escape','four local lens changes without map remount','detail/back','keyboard sheet expansion']
    assert not errors,errors
    # Actual pointer-driven sheet path, with normal motion, is distinct from keyboard snapping.
    page.emulate_media(reduced_motion='no-preference')
    page.set_viewport_size({'width':390,'height':844});page.goto(base+'/?lens=intelligence');page.wait_for_selector('.result-card')
    box=page.locator('#drag-handle').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x,y-130,steps=8)
    assert page.locator('#sheet').get_attribute('data-dragging')=='true'
    assert page.locator('#sheet').evaluate('(n)=>getComputedStyle(n).transitionDuration')=='0s'
    page.mouse.up();assert page.locator('#sheet').get_attribute('data-dragging') is None
    report['checks'].append('pointer drag uses transform with zero transition while dragging')
    page.locator('#menu-toggle').click();page.locator('#signout').click();assert page.locator('#signin').evaluate('(n)=>n.open');assert page.locator('.result-card').count()==0
    report['checks'].append('sign-out immediately clears private UI')
    report['pageErrors']=errors;report['requestCount']=len(requests);report['passed']=True
    (OUT/'browser-results.json').write_text(json.dumps(report,indent=2))
    browser.close()
server.shutdown()
print(json.dumps(report,indent=2))
