// bookmarklet

javascript:
(function(){
function f(xpath) {
var doc=document.getElementsByTagName('frame')['data'].contentDocument;
return doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
};
xp_host  = f("//a[@title='Show server details']/text()");
xp_image = f("//tr[@bgcolor='white']/td[10]");
xp_site  = f("//tr[@bgcolor='white']/td[7]");
temp = xp_host+':'+xp_image.slice(1)+': <problem> :'+xp_site;
fin=prompt("[                                             SEV 1 TEMPLATE                                             ]"+"\n\nLength is: "+ temp.length, temp);
finLen = fin.length;
if ( finLen > 60) {alert("FYI it's longer than 60 characters - more precisely: "+finLen)};
})();
