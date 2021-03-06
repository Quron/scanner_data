var requestSync = require("sync-request"),
    fs = require("fs");

const dstPath = "../cfd.json";
const groups =[
    "http://hub1.tradingview.com:8094/symbols/dxy_idc2",
    "http://hub1.tradingview.com:8094/symbols/us_chicago_indices",
    "http://hub1.tradingview.com:8094/symbols/us_ny_indices",
    "http://hub1.tradingview.com:8094/symbols/japan_indices",
    "http://hub1.tradingview.com:8094/symbols/china_indices",
    "http://hub1.tradingview.com:8094/symbols/european_indices",
    "http://hub1.tradingview.com:8094/symbols/british_indices",
    "http://hub1.tradingview.com:8094/symbols/spanish_indices",
    "http://hub1.tradingview.com:8094/symbols/government_bonds",
    "http://hub1.tradingview.com:8094/symbols/euro_bonds",
    {
        url:"http://hub1.tradingview.com:8094/symbols/forex_tvc",
        exclude:["TVC:GOLD","TVC:GOLDSILVER"]
    },
    {
        url:"http://hub1.tradingview.com:8094/symbols/oanda",
        include:[
            "OANDA:CH20CHF","OANDA:SG30SGD","OANDA:HK33HKD","OANDA:JP225USD","OANDA:UK10YBGBP","OANDA:BCOUSD","OANDA:CORNUSD",
            "OANDA:EU50EUR","OANDA:NAS100USD","OANDA:USB30YUSD","OANDA:SPX500USD","OANDA:XCUUSD","OANDA:XPTUSD",
            "OANDA:NATGASUSD","OANDA:WTICOUSD","OANDA:DE10YBEUR","OANDA:XAUUSD","OANDA:FR40EUR","OANDA:NL25EUR",
            "OANDA:US30USD","OANDA:US2000USD","OANDA:USB05YUSD","OANDA:USB02YUSD","OANDA:XAGUSD","OANDA:SUGARUSD",
            "OANDA:USB10YUSD","OANDA:XPDUSD","OANDA:XAUXAG","OANDA:AU200AUD","OANDA:UK100GBP","OANDA:DE30EUR",
            "OANDA:WHEATUSD","OANDA:SOYBNUSD"
        ]
    }
];

const types = {
    "cfd":true,
    "index":true
};

var symbols = [];
groups.forEach(function(path){
    var url = path;
    var include;
    var exclude;
    if (typeof path !== "string" && path.url){
        url = path.url;
        if (path.include){
            include = {};
            path.include.forEach(function(val){include[val] = true;});
        }
        if (path.exclude){
            exclude = {};
            path.exclude.forEach(function(val){exclude[val] = true;});
        }
    }

    var response = requestSync("GET", url);
    if (response.statusCode != 200) {
        throw Error(path + ':' + response.statusCode);
    }
    JSON.parse(response.getBody()).symbols.forEach(function(s){
        if (types[s.f[1]]){
            var skip = false;
            if (include && !include[s.s]){
                skip = true;
            }
            if (exclude && exclude[s.s]){
                skip = true;
            }
            if (!skip) {
                symbols.push(s);
            }
        }
    });
});

var bondsMarks = [
    "TREASURY NOTE", "BOND", "Bond", "T-Note", "EURO BUND"
];

var indexMarks = [
    "INDEX", "NASDAQ", "RUSSELL", "S&P", "DOW JONES", "STOXX", "Australia", "Swiss", "Germany", "Europe", "France",
    "Hong Kong", "Japan", "Netherlands", "NIKKEI", "FTSE", "Singapore", "CAC", "HANG SENG", "SHANGHAI COMPOSITE", "NYSE COMPOSITE",
    "UK 10Y Gilt","Bund","IBEX 35","DAX PERFORMANCE","US Wall St 30","US Nas 100","UK 100","US Russ 2000","AEX","US SPX 500"
];

var commoditiesMarks = [
    "Brent", "BRENT CRUDE OIL", "WTI", "West Texas Oil", "GOLD", "Gold", "SILVER", "Silver", "Sugar", "Corn", "Gas", "PALLADIUM", "Palladium",
    "PLATINUM", "Platinum", "Soybeans", "Copper", "Wheat"
];

function matches(s, values){
    for (var i = 0; i < values.length; i++){
        if (s.indexOf(values[i])>=0){
            return true;
        }
    }
    return false;
}

function tryDetectCategory(f){
    if (f[1] === "index" || matches(f[5], indexMarks)){
        return "index";
    }
    if (matches(f[5], bondsMarks)){
        return "bond";
    }
    if (matches(f[5], commoditiesMarks)){
        return "commodity";
    }
    return ""; // TODO
}

var emptyCategoryCount = 0;
var dstSymbols = [];
symbols.forEach(function(s){
    var dst = {f:[]};
    dst.s = s.s;
    var cat = tryDetectCategory(s.f);
    if (!cat){
        emptyCategoryCount++;
    }
    dst.f[0] = cat;
    dstSymbols.push(dst);
});

dstSymbols.sort(function(l,r){
    return l.s.localeCompare(r.s);
});

console.info("Symbols with empty category is " + emptyCategoryCount);

fs.writeFileSync(dstPath, JSON.stringify(
    {"time": new Date().toISOString()+'', "fields": ["sector"], "symbols": dstSymbols}, null, 2));