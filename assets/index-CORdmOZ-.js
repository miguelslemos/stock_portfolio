import{G as U,g as E}from"./vendor-xYRcKbug.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();class h{constructor(t,e){if(this.amount=t,this.currency=e,!Number.isFinite(t))throw new Error("Money amount must be a finite number");if(!e||e.trim().length===0)throw new Error("Currency is required")}add(t){if(this.currency!==t.currency)throw new Error(`Cannot add ${t.currency} to ${this.currency}`);return new h(this.amount+t.amount,this.currency)}subtract(t){if(this.currency!==t.currency)throw new Error(`Cannot subtract ${t.currency} from ${this.currency}`);return new h(this.amount-t.amount,this.currency)}multiply(t){return new h(this.amount*t,this.currency)}divide(t){if(t===0)throw new Error("Cannot divide by zero");return new h(this.amount/t,this.currency)}}class B{constructor(t){if(this.value=t,t<0)throw new Error("Stock quantity cannot be negative");if(!Number.isInteger(t))throw new Error("Stock quantity must be an integer")}toString(){return this.value.toString()}add(t){return new B(this.value+t.value)}subtract(t){return new B(this.value-t.value)}}class S{constructor(t,e){if(this.amount=t,this.currency=e,!e)throw new Error("Currency is required")}toString(){return`${this.amount.toFixed(4)} ${this.currency}`}add(t){if(this.currency!==t.currency)throw new Error(`Cannot add ${t.currency} to ${this.currency}`);return new S(this.amount+t.amount,this.currency)}}class T{constructor(t,e,a,s=null,r=null){if(this.fromCurrency=t,this.toCurrency=e,this.date=a,this.bidRate=s,this.askRate=r,s!==null&&s<=0)throw new Error("Bid rate must be positive");if(r!==null&&r<=0)throw new Error("Ask rate must be positive");if(s===null&&r===null)throw new Error("At least one of bidRate or askRate must be provided")}convert(t,e=!1){if(t.currency!==this.fromCurrency)throw new Error(`Cannot convert ${t.currency} using ${this.fromCurrency}/${this.toCurrency} rate`);const a=e?this.bidRate:this.askRate;if(a===null)throw new Error(`${e?"Bid":"Ask"} rate is not available`);const s=t.amount*a;return new h(s,this.toCurrency)}}class D{constructor(t,e,a,s,r,o){if(this.quantity=t,this.totalCostUsd=e,this.totalCostBrl=a,this.averagePriceUsd=s,this.grossProfitBrl=r,this.lastUpdated=o,t.value<0)throw new Error("Quantity cannot be negative");if(e.currency!=="USD")throw new Error("Total cost USD must be in USD currency");if(a.currency!=="BRL")throw new Error("Total cost BRL must be in BRL currency")}get isEmpty(){return this.quantity.value===0}averagePriceBrl(t){if(t<=0)throw new Error("PTAX bid rate must be positive");return new h(this.averagePriceUsd.amount*t,"BRL")}calculateAveragePrice(t,e){if(this.isEmpty)return new h(0,t);if(t==="USD")return new h(this.totalCostUsd.amount/this.quantity.value,"USD");if(t==="BRL"){if(e===void 0)throw new Error("PTAX bid rate is required to calculate BRL average price");return this.averagePriceBrl(e)}else throw new Error(`Unsupported currency: ${t}`)}static createEmpty(t){return new D(new B(0),new h(0,"USD"),new h(0,"BRL"),new h(0,"USD"),new S(0,"BRL"),t)}resetGrossProfitForNewYear(){return new D(this.quantity,this.totalCostUsd,this.totalCostBrl,this.averagePriceUsd,new S(0,"BRL"),this.lastUpdated)}}class R{constructor(t,e,a,s,r,o,i){this.operationType=t,this.operationDate=e,this.settlementDate=a,this.quantity=s,this.pricePerShareUsd=r,this.exchangeRates=o,this.tradeFinancials=i}get isVesting(){return this.operationType==="vesting"}get isTrade(){return this.operationType==="trade"}get hasProfitLoss(){return this.tradeFinancials!==void 0}get profitLossBrl(){return this.tradeFinancials?.profitLossBrl??null}get totalCostUsd(){return new h(this.pricePerShareUsd.amount*this.quantity.value,"USD")}get totalCostBrl(){return new h(this.totalCostUsd.amount*this.exchangeRates.ptaxBid,"BRL")}}class F{constructor(t,e){this.position=t,this.metadata=e}get profitLossBrl(){return this.metadata.profitLossBrl}get hasProfitLoss(){return this.metadata.hasProfitLoss}get ptaxBid(){return this.metadata.exchangeRates.ptaxBid}get ptaxAsk(){return this.metadata.exchangeRates.ptaxAsk}}class q{constructor(t,e,a=null){this.position=t,this.metadata=e,this.previousPosition=a}toCSVRow(){const t=this.metadata.exchangeRates.ptaxBid;return[this.formatDate(this.metadata.operationDate),this.getOperationDescription(),this.metadata.quantity.value.toString(),this.position.quantity.value.toString(),this.position.totalCostUsd.amount.toFixed(4),this.position.averagePriceUsd.amount.toFixed(4),this.position.totalCostBrl.amount.toFixed(4),this.position.averagePriceBrl(t).amount.toFixed(4),this.position.grossProfitBrl.amount.toFixed(4)]}getCSVHeaders(){return["Data","Operação","Quantidade da Operação","Quantidade Total","Custo Total USD","Preço Médio USD","Custo Total BRL","Preço Médio BRL","Lucro Bruto BRL"]}toPDFSection(){const t=[{label:"Operation Date",value:this.formatDate(this.metadata.operationDate),format:"date"},{label:"Settlement Date",value:this.formatDate(this.metadata.settlementDate),format:"date"},{label:"Quantity",value:this.metadata.quantity.value,format:"number"},{label:"Price per Share",value:this.metadata.pricePerShareUsd.amount,format:"currency",currency:"USD"},{label:"Total Quantity After",value:this.position.quantity.value,format:"number"},{label:"Average Price USD",value:this.position.averagePriceUsd.amount,format:"currency",currency:"USD"},{label:"PTAX Bid",value:this.metadata.exchangeRates.ptaxBid,format:"number"},{label:"PTAX Ask",value:this.metadata.exchangeRates.ptaxAsk,format:"number"}];return this.metadata.tradeFinancials&&t.push({label:"Sale Revenue USD",value:this.metadata.tradeFinancials.saleRevenueUsd.amount,format:"currency",currency:"USD"},{label:"Sale Revenue BRL",value:this.metadata.tradeFinancials.saleRevenueBrl.amount,format:"currency",currency:"BRL"},{label:"Cost Basis BRL",value:this.metadata.tradeFinancials.costBasisBrl.amount,format:"currency",currency:"BRL"},{label:"Profit/Loss BRL",value:this.metadata.tradeFinancials.profitLossBrl.amount,format:"currency",currency:"BRL"}),t.push({label:"Gross Profit BRL",value:this.position.grossProfitBrl.amount,format:"currency",currency:"BRL"}),{title:this.metadata.isVesting?"Vesting Operation":"Trade Operation",date:this.metadata.operationDate,type:this.metadata.operationType,fields:t}}toJSON(){return{operation:{type:this.metadata.operationType,date:this.metadata.operationDate.toISOString(),settlementDate:this.metadata.settlementDate.toISOString(),quantity:this.metadata.quantity.value,pricePerShare:this.metadata.pricePerShareUsd.amount},position:{quantity:this.position.quantity.value,totalCostUsd:this.position.totalCostUsd.amount,totalCostBrl:this.position.totalCostBrl.amount,averagePriceUsd:this.position.averagePriceUsd.amount,grossProfitBrl:this.position.grossProfitBrl.amount,lastUpdated:this.position.lastUpdated.toISOString()},exchangeRates:{ptaxBid:this.metadata.exchangeRates.ptaxBid,ptaxAsk:this.metadata.exchangeRates.ptaxAsk},tradeDetails:this.metadata.tradeFinancials?{saleRevenueUsd:this.metadata.tradeFinancials.saleRevenueUsd.amount,saleRevenueBrl:this.metadata.tradeFinancials.saleRevenueBrl.amount,costBasisUsd:this.metadata.tradeFinancials.costBasisUsd.amount,costBasisBrl:this.metadata.tradeFinancials.costBasisBrl.amount,profitLossBrl:this.metadata.tradeFinancials.profitLossBrl.amount}:null}}getOperationDescription(){const t=this.metadata.isVesting?"+":"-";return`${this.metadata.operationType} (${t}${this.metadata.quantity.value})`}getOperationProfitLoss(){if(!this.metadata.tradeFinancials||!this.previousPosition)return null;const t=this.position.grossProfitBrl.amount-this.previousPosition.grossProfitBrl.amount;return new S(t,"BRL")}formatDate(t){const e=String(t.getDate()).padStart(2,"0"),a=String(t.getMonth()+1).padStart(2,"0"),s=t.getFullYear();return`${e}/${a}/${s}`}}class O{constructor(t,e,a,s){this.operationRepository=t,this.calculationService=e,this.analyticsService=a,this.exportService=s}async execute(t){const e=await this.operationRepository.getAllOperations();if(e.length===0)return{finalPosition:D.createEmpty(new Date),snapshots:[],totalOperations:0,totalReturnBrl:new S(0,"BRL")};const{positions:a,results:s}=await this.calculationService.executeOperations(e,t.initialPosition),r=a[a.length-1];if(!r)throw new Error("Failed to calculate final position");const o=s.map((n,l)=>{const d=l>0?a[l-1]??null:null;return new q(n.position,n.metadata,d)}),i=this.analyticsService.calculateTotalReturnBrl(a);return t.exportData&&this.exportService&&this.exportService.exportPortfolioData(o),{finalPosition:r,snapshots:o,totalOperations:e.length,totalReturnBrl:i}}}class A{constructor(t){this.exchangeRateService=t}async executeOperations(t,e){if(t.length===0)return{positions:[],results:[]};const a=[...t].sort((i,n)=>i.getDate().getTime()-n.getDate().getTime());let s=e??D.createEmpty(a[0].getDate());e&&a[0].getDate().getFullYear()>s.lastUpdated.getFullYear()&&(s=s.resetGrossProfitForNewYear());const r=[],o=[];for(const i of a){const n=i.getDate();r.length>0&&n.getFullYear()>s.lastUpdated.getFullYear()&&(s=s.resetGrossProfitForNewYear());const l=await this.getExchangeRateForOperation(i),d=i.execute(s,l);s=d.position,r.push(s),o.push(d)}return{positions:r,results:o}}async getExchangeRateForOperation(t){const e=t.getSettlementDate();for(let a=0;a<=7;a++){const s=new Date(e);s.setDate(s.getDate()-a);const r=await this.exchangeRateService.getRate("USD","BRL",s);if(r!==null)return r}throw new Error(`Could not find USD/BRL exchange rate for ${e.toISOString()} (tried 7 days back)`)}}class M{calculateTotalReturnBrl(t){return t.length===0?new S(0,"BRL"):t[t.length-1].grossProfitBrl}calculatePositionValueBrl(t,e,a){if(t.isEmpty)return new h(0,"BRL");const s=new h(e.amount*t.quantity.value,"USD");return a.convert(s)}calculateUnrealizedGainLossBrl(t,e,a){if(t.isEmpty)return new h(0,"BRL");const s=this.calculatePositionValueBrl(t,e,a);return new h(s.amount-t.totalCostBrl.amount,"BRL")}}class I{cache=new Map;MAX_RETRIES=3;TIMEOUT_MS=5e3;CACHE_TTL_MS=1440*60*1e3;MAX_CACHE_SIZE=1e3;async getRate(t,e,a){if(t!=="USD"||e!=="BRL")throw new Error(`Unsupported currency pair: ${t}/${e}`);const s=`${t}-${e}-${a.toISOString().split("T")[0]}`,r=this.cache.get(s);if(r&&Date.now()-r.timestamp<this.CACHE_TTL_MS)return r.rate;this.cache.size>=this.MAX_CACHE_SIZE&&this.evictOldestEntries();try{const o=await this.fetchRateFromBCB(a);return this.cache.set(s,{rate:o,timestamp:Date.now()}),o}catch{return this.cache.set(s,{rate:null,timestamp:Date.now()}),null}}evictOldestEntries(){const t=Math.floor(this.cache.size*.2),e=Array.from(this.cache.entries()).sort(([,a],[,s])=>a.timestamp-s.timestamp);for(let a=0;a<t;a++){const s=e[a]?.[0];s&&this.cache.delete(s)}}async fetchRateFromBCB(t){const e=this.formatDate(t),a=`https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${e}'&$format=json`;try{const s=await this.fetchWithRetry(a);if(!s.ok)return null;const r=await s.json();if(r.value&&r.value.length>0){const o=r.value[0];return new T("USD","BRL",t,o.cotacaoCompra,o.cotacaoVenda)}return null}catch(s){const r=s instanceof Error?s.message:String(s);throw new Error(`Failed to fetch exchange rate from BCB for ${e}: ${r}`)}}async fetchWithRetry(t){let e;for(let s=0;s<this.MAX_RETRIES;s++)try{const r=new AbortController,o=setTimeout(()=>r.abort(),this.TIMEOUT_MS),i=await fetch(t,{signal:r.signal});if(clearTimeout(o),!i)throw new Error("Fetch returned null or undefined response");if(i.ok||i.status===404)return i;throw new Error(`Request failed with status ${i.status}`)}catch(r){if(e=r,r instanceof Error&&r.name==="AbortError")throw new Error(`Request timeout after ${this.TIMEOUT_MS}ms`);s<this.MAX_RETRIES-1&&await new Promise(o=>setTimeout(o,1e3*Math.pow(2,s)))}const a=e instanceof Error?e.message:String(e);throw new Error(`Failed after ${this.MAX_RETRIES} retries: ${a}`)}formatDate(t){const e=String(t.getMonth()+1).padStart(2,"0"),a=String(t.getDate()).padStart(2,"0"),s=t.getFullYear();return`${e}-${a}-${s}`}}class V{exportPortfolioData(t){const e=this.generatePortfolioHistoryCSV(t),a=this.generateYearlySummaryCSV(t);this.downloadCSV(e,"portfolio_history.csv"),this.downloadCSV(a,"yearly_summary.csv")}generatePortfolioHistoryCSV(t){if(t.length===0)return"";const e=t[0].getCSVHeaders(),a=t.map(s=>s.toCSVRow());return this.arrayToCSV([e,...a])}generateYearlySummaryCSV(t){const e=["Ano","Quantidade Final","Custo Total USD","Preço Médio USD","Custo Total BRL","Preço Médio BRL","Lucro Bruto BRL"],a=this.getYearlySnapshots(t),s=Array.from(a.entries()).sort(([r],[o])=>r-o).map(([r,o])=>{const i=o.position,n=o.metadata.exchangeRates.ptaxBid;return[r.toString(),i.quantity.value.toString(),i.totalCostUsd.amount.toFixed(4),i.averagePriceUsd.amount.toFixed(4),i.totalCostBrl.amount.toFixed(4),i.averagePriceBrl(n).amount.toFixed(4),i.grossProfitBrl.amount.toFixed(4)]});return this.arrayToCSV([e,...s])}getYearlySnapshots(t){const e=new Map;for(const a of t){const s=a.position.lastUpdated.getFullYear(),r=e.get(s);(!r||a.position.lastUpdated>=r.position.lastUpdated)&&e.set(s,a)}return e}arrayToCSV(t){return t.map(e=>e.map(a=>this.escapeCSVCell(a)).join(",")).join(`
`)}escapeCSVCell(t){return t.includes(",")||t.includes('"')||t.includes(`
`)||t.includes("\r")?`"${t.replace(/"/g,'""')}"`:t}downloadCSV(t,e){const s=new Blob(["\uFEFF"+t],{type:"text/csv;charset=utf-8;"}),r=document.createElement("a"),o=URL.createObjectURL(s);r.setAttribute("href",o),r.setAttribute("download",e),r.style.visibility="hidden",document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(o)}}class L{constructor(t,e,a,s=null){if(this.date=t,this.quantity=e,this.pricePerShareUsd=a,a.currency!=="USD")throw new Error("Vesting price must be in USD");if(e.value<=0)throw new Error("Vesting quantity must be positive");this._settlementDate=s}_settlementDate;get settlementDate(){return this._settlementDate??this.date}execute(t,e){const a=e.bidRate,s=e.askRate;if(a===null||s===null)throw new Error("Both bid and ask rates are required for vesting operation");const r=new h(this.pricePerShareUsd.amount*this.quantity.value,"USD"),o=e.convert(r,!0),i=new B(t.quantity.value+this.quantity.value),n=new h(t.totalCostUsd.amount+r.amount,"USD"),l=new h(t.totalCostBrl.amount+o.amount,"BRL"),d=new h(i.value>0?n.amount/i.value:0,"USD"),u=new D(i,n,l,d,t.grossProfitBrl,this.date),m=new R("vesting",this.date,this.settlementDate,this.quantity,this.pricePerShareUsd,{ptaxBid:a,ptaxAsk:s},void 0);return new F(u,m)}getDate(){return this.date}getSettlementDate(){return this.settlementDate}getDescription(){return`Vesting: +${this.quantity.value} shares at $${this.pricePerShareUsd.amount.toFixed(4)}`}}class x{constructor(t,e,a,s=null){if(this.date=t,this.quantity=e,this.pricePerShareUsd=a,a.currency!=="USD")throw new Error("Trade price must be in USD");if(e.value<=0)throw new Error("Trade quantity must be positive");this._settlementDate=s}_settlementDate;get settlementDate(){return this._settlementDate??this.date}execute(t,e){if(this.quantity.value>t.quantity.value)throw new Error(`Cannot sell ${this.quantity.value} shares, only ${t.quantity.value} available`);if(t.quantity.value===0)throw new Error("Cannot sell from empty portfolio");const a=e.bidRate,s=e.askRate;if(a===null||s===null)throw new Error("Both bid and ask rates are required for trade operation");const r=this.quantity.value/t.quantity.value,o=new B(t.quantity.value-this.quantity.value),i=new h(t.totalCostUsd.amount*(1-r),"USD"),n=new h(t.totalCostBrl.amount*(1-r),"BRL"),l=t.averagePriceUsd,d=new h(this.pricePerShareUsd.amount*this.quantity.value,"USD"),u=e.convert(d),m=new h(t.averagePriceUsd.amount*this.quantity.value,"USD"),v=new h(m.amount*a,"BRL"),f=new S(u.amount-v.amount,"BRL"),w=new S(t.grossProfitBrl.amount+f.amount,"BRL"),y=new D(o,i,n,l,w,this.date),P={saleRevenueUsd:d,saleRevenueBrl:u,costBasisUsd:m,costBasisBrl:v,profitLossBrl:f},C=new R("trade",this.date,this.settlementDate,this.quantity,this.pricePerShareUsd,{ptaxBid:a,ptaxAsk:s},P);return new F(y,C)}getDate(){return this.date}getSettlementDate(){return this.settlementDate}getDescription(){return`Trade: -${this.quantity.value} shares at $${this.pricePerShareUsd.amount.toFixed(4)}`}}class b{static formats=[/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,/^(\d{1,2})-(\d{1,2})-(\d{4})$/,/^(\d{1,2})-(\d{1,2})-(\d{2})$/,/^(\d{4})-(\d{1,2})-(\d{1,2})$/,/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/];static parse(t){const e=t.trim();for(let a=0;a<this.formats.length;a++){const s=this.formats[a],r=e.match(s);if(r){let o,i,n;if(a===4||a===5)n=parseInt(r[1]),o=parseInt(r[2]),i=parseInt(r[3]);else{o=parseInt(r[1]),i=parseInt(r[2]);const l=r[3];n=l.length===2?2e3+parseInt(l):parseInt(l)}if(o<1||o>12)throw new Error(`Invalid month: ${o} in date ${e}`);if(i<1||i>31)throw new Error(`Invalid day: ${i} in date ${e}`);return new Date(n,o-1,i)}}throw new Error(`Invalid date format: ${e}. Supported formats: MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD`)}static format(t){const e=t.getFullYear(),a=String(t.getMonth()+1).padStart(2,"0"),s=String(t.getDate()).padStart(2,"0");return`${e}-${a}-${s}`}}class k{constructor(t){this.jsonData=t}async getAllOperations(){try{return JSON.parse(this.jsonData).map(e=>this.createOperationFromObject(e))}catch(t){throw new Error(`Failed to parse JSON operations: ${String(t)}`)}}createOperationFromObject(t){const e=t.type.toLowerCase(),a=new B(Math.floor(t.quantity)),s=new h(t.price,"USD"),r=b.parse(t.date),o=t.settlement_date?b.parse(t.settlement_date):null;if(e==="vesting")return new L(r,a,s,o);if(e==="trade")return new x(r,a,s,o);throw new Error(`Unsupported operation type: ${e}`)}}U.workerSrc=new URL("/stock_portfolio/assets/pdf.worker.min-CXgfMxHN.mjs",import.meta.url).toString();class Y{constructor(t,e,a){this.tradePDFs=t,this.releasePDFs=e,this.onProgress=a}async getAllOperations(){const t=this.tradePDFs.length+this.releasePDFs.length;let e=0;const a=[],s=this.tradePDFs.map(async n=>{try{const l=await this.extractTradeOperation(n);return e++,this.onProgress?.(e,t),l||null}catch(l){return console.error(`Error processing trade PDF ${n.name}:`,l),e++,this.onProgress?.(e,t),null}}),r=this.releasePDFs.map(async n=>{try{const l=await this.extractVestingOperation(n);return e++,this.onProgress?.(e,t),l||null}catch(l){return console.error(`Error processing vesting PDF ${n.name}:`,l),e++,this.onProgress?.(e,t),null}}),[o,i]=await Promise.all([Promise.all(s),Promise.all(r)]);return a.push(...o.filter(n=>n!==null)),a.push(...i.filter(n=>n!==null)),a}async extractTradeOperation(t){const e=await this.extractTextFromPDF(t),a=/Trade Date\s+Settlement Date\s+Quantity\s+Price\s+Settlement Amount[\s\S]*?([\d\/\-]+)\s+([\d\/\-]+)\s+([\d,.]+)\s+([\d,.]+)/,s=/TRADE\s+DATE\s+SETL\s+DATE\s+MKT\s+\/\s+CPT\s+SYMBOL\s+\/\s+CUSIP\s+BUY\s+\/\s+SELL\s+QUANTITY\s+PRICE\s+ACCT\s+TYPE[\s\n]+([\d\/\-]+)\s+([\d\/\-]+)\s+[\d,\w,\s]+\s+([\d,.]+)\s+([\d,.,$]+)/;let r=e.match(a);if(r||(r=e.match(s)),r){const o=r[1].trim(),i=r[2].trim(),n=r[3].trim().replace(/,/g,""),l=r[4].replace(/[$,]/g,"").trim(),d=b.parse(o),u=b.parse(i),m=new B(Math.floor(parseFloat(n))),v=new h(parseFloat(l),"USD");return new x(d,m,v,u)}return console.warn(`Could not extract trade operation from file: ${t.name}`),null}async extractVestingOperation(t){const e=await this.extractTextFromPDF(t),a=e.match(/Release Date\s+([\d\-\/]+)/),s=e.match(/Shares Issued\s+([\d,.]+)/),r=e.match(/Market Value Per Share\s+\$?\s*([\d,.]+)/);if(!a||!s||!r)return console.warn(`Could not extract vesting operation from file: ${t.name}`),null;const o=a[1].trim(),i=s[1].replace(/,/g,"").trim(),n=r[1].replace(/,/g,"").trim(),l=b.parse(o),d=new B(Math.floor(parseFloat(i))),u=new h(parseFloat(n),"USD");return new L(l,d,u)}async extractTextFromPDF(t){try{const e=await t.arrayBuffer(),s=await E({data:e}).promise;let r="";for(let o=1;o<=s.numPages;o++){const l=(await(await s.getPage(o)).getTextContent()).items.map(d=>d&&typeof d=="object"&&"str"in d?d.str:"").join(" ");r+=l+`
`}return r}catch(e){throw e}}}class _{constructor(t){this.repositories=t}async getAllOperations(){const t=[];for(const e of this.repositories)try{const a=await e.getAllOperations();t.push(...a)}catch{}return t.sort((e,a)=>e.getDate().getTime()-a.getDate().getTime()),t}}class c{static formatter2=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2});static formatter4=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:4,maximumFractionDigits:4});static format(t,e=2){return(e===4?this.formatter4:this.formatter2).format(t)}static formatWithPrecision(t){const e=Math.abs(t-Math.floor(t))>.01;return this.format(t,e?4:2)}}class g{static formatter2=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2});static formatter4=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:4,maximumFractionDigits:4});static format(t,e=2){return(e===4?this.formatter4:this.formatter2).format(t)}static formatWithPrecision(t){const e=Math.abs(t-Math.floor(t))>.01;return this.format(t,e?4:2)}}class ${static format(t){const e=String(t.getDate()).padStart(2,"0"),a=String(t.getMonth()+1).padStart(2,"0"),s=t.getFullYear();return`${e}/${a}/${s}`}static formatLong(t){return t.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}}class j{static createOperationModal(t){const e=t.position,a=t.metadata,s=t.previousPosition,r=a.isVesting,o=a.isTrade,i=a.quantity.value,n=s?.quantity.value??0,l=a.exchangeRates.ptaxBid,d=a.exchangeRates.ptaxAsk,u=this.generateDescription(t,n,l,d),m=`
      <div class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>📋 Detalhes da Operação</h2>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            
            ${this.renderGeneralInfo(a,i,r)}
            ${this.renderPortfolioPosition(e,n)}
            ${this.renderAveragePrices(e,l)}
            ${o?this.renderTradeDetails(t,d):""}
            ${o?this.renderProfitLoss(t,s):""}
            
            <div class="detail-section">
              <h3>Descrição da Operação</h3>
              <div class="description-box">
                ${u}
              </div>
            </div>

          </div>
        </div>
      </div>
    `,v=document.createElement("div");return v.innerHTML=m,v.firstElementChild}static generateDescription(t,e,a,s){const r=t.position,o=t.metadata,i=t.previousPosition,n=o.isVesting,l=o.quantity.value,d=$.format(o.settlementDate);if(n){const u=o.pricePerShareUsd.amount,m=o.totalCostUsd.amount,v=o.totalCostBrl.amount;return`
        <strong>Operação de Vesting em NU</strong><br><br>
        Em <strong>${d}</strong>, foram adicionadas <strong>${l} ações</strong> 
        ao portfólio através de vesting.<br><br>
        
        <strong>Custo da operação:</strong><br>
        • Valor unitário: ${g.formatWithPrecision(u)}<br>
        • Custo total: ${g.format(m)} 
        = ${c.format(v)} 
        (PTAX Compra ${c.formatWithPrecision(a)})<br><br>
        
        <strong>Impacto no portfólio:</strong><br>
        • Ações antes: ${e}<br>
        • Ações adicionadas: +${l}<br>
        • Ações após: <strong>${r.quantity.value}</strong><br>
        • Novo preço médio: ${g.formatWithPrecision(r.averagePriceUsd.amount)} 
        (${c.formatWithPrecision(r.averagePriceBrl(a).amount)})<br>
        • Custo total acumulado: ${c.format(r.totalCostBrl.amount)}
      `}else{const u=o.tradeFinancials;if(!u||!i)return"";const m=r.grossProfitBrl.amount-i.grossProfitBrl.amount,v=i.averagePriceUsd.amount,f=o.pricePerShareUsd.amount,w=f-v;return`
        <strong>Operação Encerrada em NU</strong><br><br>
        Em <strong>${d}</strong>, o ganho de capital foi de 
        <strong class="${m>=0?"positive":"negative"}">${c.format(m)}</strong> 
        ⇒ débito de ${c.format(u.costBasisBrl.amount)} 
        (${g.formatWithPrecision(v)} × 
        PTAX ${c.formatWithPrecision(a)}) 
        e crédito de ${c.format(u.saleRevenueBrl.amount)} 
        (${g.format(u.saleRevenueUsd.amount)} × 
        PTAX ${c.formatWithPrecision(s)}).<br><br>
        
        <strong>Detalhes da venda:</strong><br>
        • Quantidade vendida: <strong>${l} ações</strong><br>
        • Preço de venda: ${g.formatWithPrecision(f)} por ação<br>
        • Preço médio de custo: ${g.formatWithPrecision(v)} por ação<br>
        • Lucro por ação (USD): ${g.format(w)}<br>
        • Lucro por ação (BRL): ${c.format(w*s)}<br><br>
        
        <strong>Resultado:</strong><br>
        • Ações restantes: <strong>${r.quantity.value}</strong><br>
        • Lucro bruto acumulado: ${c.format(r.grossProfitBrl.amount)}
      `}}static renderGeneralInfo(t,e,a){return`
      <div class="detail-section">
        <h3>Informações Gerais</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Tipo de Operação</label>
            <div class="value">
              <span class="operation-badge ${a?"vesting":"trade"}">
                ${a?"📈 Vesting":"📉 Trade (Venda)"}
              </span>
            </div>
          </div>
          <div class="detail-item">
            <label>Data da Operação</label>
            <div class="value">${$.formatLong(t.operationDate)}</div>
          </div>
          <div class="detail-item">
            <label>Data da Liquidação</label>
            <div class="value">${$.formatLong(t.settlementDate)}</div>
          </div>
          <div class="detail-item">
            <label>Quantidade da Operação</label>
            <div class="value large">${a?"+":"-"}${e}</div>
          </div>
        </div>
      </div>
    `}static renderPortfolioPosition(t,e){return`
      <div class="detail-section">
        <h3>Posição do Portfólio</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Ações Antes</label>
            <div class="value">${e}</div>
          </div>
          <div class="detail-item">
            <label>Ações Após</label>
            <div class="value large">${t.quantity.value}</div>
          </div>
        </div>
      </div>
    `}static renderAveragePrices(t,e){return`
      <div class="detail-section">
        <h3>Preços Médios</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Preço Médio (USD)</label>
            <div class="value">${g.formatWithPrecision(t.averagePriceUsd.amount)}</div>
          </div>
          <div class="detail-item">
            <label>Preço Médio (BRL)</label>
            <div class="value">${c.formatWithPrecision(t.averagePriceBrl(e).amount)}</div>
          </div>
          <div class="detail-item">
            <label>PTAX Compra</label>
            <div class="value">${c.formatWithPrecision(e)}</div>
          </div>
        </div>
        <div class="calculation-detail">
          <div class="formula">Preço Médio BRL = Preço Médio USD × PTAX Compra</div>
          ${c.formatWithPrecision(t.averagePriceBrl(e).amount)} = ${g.formatWithPrecision(t.averagePriceUsd.amount)} × ${e.toFixed(6)}
        </div>
      </div>
    `}static renderTradeDetails(t,e){const a=t.metadata.tradeFinancials;if(!a)return"";const s=t.metadata.pricePerShareUsd.amount,r=t.metadata.quantity.value;return`
      <div class="detail-section">
        <h3>Valores da Venda</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Preço de Liquidação (USD)</label>
            <div class="value">${g.formatWithPrecision(s)}</div>
          </div>
          <div class="detail-item">
            <label>Total Liquidado (USD)</label>
            <div class="value">${g.format(a.saleRevenueUsd.amount)}</div>
          </div>
          <div class="detail-item">
            <label>Total Liquidado (BRL)</label>
            <div class="value">${c.format(a.saleRevenueBrl.amount)}</div>
          </div>
          <div class="detail-item">
            <label>PTAX Venda</label>
            <div class="value">${c.formatWithPrecision(e)}</div>
          </div>
        </div>
        <div class="calculation-detail">
          <div class="formula">Total Liquidado USD = Preço de Liquidação × Quantidade</div>
          ${g.format(a.saleRevenueUsd.amount)} = ${g.formatWithPrecision(s)} × ${r}
        </div>
        <div class="calculation-detail">
          <div class="formula">Liquidado BRL = Liquidado USD × PTAX Venda</div>
          ${c.format(a.saleRevenueBrl.amount)} = ${g.format(a.saleRevenueUsd.amount)} × ${e.toFixed(6)}
        </div>
      </div>
    `}static renderProfitLoss(t,e){const a=t.metadata.tradeFinancials;if(!a||!e)return"";const s=t.position.grossProfitBrl.amount-e.grossProfitBrl.amount;return`
      <div class="detail-section">
        <h3>Lucro/Prejuízo</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Custo Base (BRL)</label>
            <div class="value">${c.format(a.costBasisBrl.amount)}</div>
          </div>
          <div class="detail-item">
            <label>Ganho de Capital</label>
            <div class="value ${s>=0?"positive":"negative"}">
              ${c.format(s)}
            </div>
          </div>
        </div>
        <div class="calculation-detail">
          <div class="formula">Ganho de Capital = Liquidado BRL - Custo Base BRL</div>
          ${c.format(s)} = ${c.format(a.saleRevenueBrl.amount)} - ${c.format(a.costBasisBrl.amount)}
        </div>
      </div>
    `}}class N{static createYearModal(t,e){const a=e[0],s=e[e.length-1];if(!a||!s)throw new Error("No snapshots for year");const r=s.position,o=a.previousPosition,i=e.filter(y=>y.metadata.isVesting),n=e.filter(y=>y.metadata.isTrade),l=i.reduce((y,P)=>y+P.metadata.quantity.value,0),d=n.reduce((y,P)=>y+P.metadata.quantity.value,0),u=n.reduce((y,P)=>{const C=P.metadata.tradeFinancials?.profitLossBrl.amount??0;return y+C},0),m=e.reduce((y,P)=>y+P.metadata.exchangeRates.ptaxBid,0)/e.length,v=e.reduce((y,P)=>y+P.metadata.exchangeRates.ptaxAsk,0)/e.length,f=`
      <div class="modal-overlay">
        <div class="modal modal-large">
          <div class="modal-header">
            <h2>📅 Detalhes do Ano ${t}</h2>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            
            ${this.renderYearSummary(t,e,r,o,l,d,u,m,v)}
            ${this.renderOperationsTable(e)}
            ${this.renderTaxSummary(t,n,u)}

          </div>
        </div>
      </div>
    `,w=document.createElement("div");return w.innerHTML=f,w.firstElementChild}static renderYearSummary(t,e,a,s,r,o,i,n,l){const d=s?.quantity.value??0,u=a.quantity.value,m=u-d,v=e[e.length-1].metadata.exchangeRates.ptaxBid;return`
      <div class="detail-section">
        <h3>Resumo do Ano ${t}</h3>
        <div class="year-summary-grid">
          <div class="summary-card">
            <div class="summary-label">Total de Operações</div>
            <div class="summary-value">${e.length}</div>
            <div class="summary-detail">${e.filter(f=>f.metadata.isVesting).length} vestings • ${e.filter(f=>f.metadata.isTrade).length} vendas</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Ações Recebidas (Vesting)</div>
            <div class="summary-value positive">+${r}</div>
            <div class="summary-detail">${e.filter(f=>f.metadata.isVesting).length} operações</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Ações Vendidas</div>
            <div class="summary-value ${o>0?"negative":""}">-${o}</div>
            <div class="summary-detail">${e.filter(f=>f.metadata.isTrade).length} operações</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Variação Líquida</div>
            <div class="summary-value ${m>=0?"positive":"negative"}">${m>=0?"+":""}${m}</div>
            <div class="summary-detail">${d} → ${u} ações</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Lucro/Prejuízo Total</div>
            <div class="summary-value ${i>=0?"positive":"negative"}">
              ${c.format(i)}
            </div>
            <div class="summary-detail">Apenas vendas</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Lucro Bruto Acumulado</div>
            <div class="summary-value ${a.grossProfitBrl.amount>=0?"positive":"negative"}">
              ${c.format(a.grossProfitBrl.amount)}
            </div>
            <div class="summary-detail">Posição final do ano</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">PTAX Média Compra</div>
            <div class="summary-value">${n.toFixed(4)}</div>
            <div class="summary-detail">Média das operações</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">PTAX Média Venda</div>
            <div class="summary-value">${l.toFixed(4)}</div>
            <div class="summary-detail">Média das operações</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Preço Médio Final (USD)</div>
            <div class="summary-value">${g.formatWithPrecision(a.averagePriceUsd.amount)}</div>
            <div class="summary-detail">Por ação</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Preço Médio Final (BRL)</div>
            <div class="summary-value">${c.formatWithPrecision(a.averagePriceBrl(v).amount)}</div>
            <div class="summary-detail">Por ação</div>
          </div>
        </div>
      </div>
    `}static renderOperationsTable(t){return`
      <div class="detail-section">
        <h3>Operações do Ano</h3>
        <div class="operations-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Operação</th>
                <th>Qtd. Op.</th>
                <th>Preço (USD)</th>
                <th>Qtd. Final</th>
                <th>Preço Médio (USD)</th>
                <th>Preço Médio (BRL)</th>
                <th>Lucro/Prejuízo</th>
              </tr>
            </thead>
            <tbody>
              ${t.map(a=>{const s=a.metadata,r=a.position,o=s.exchangeRates.ptaxBid,i=a.getOperationDescription(),n=a.getOperationProfitLoss();return`
        <tr>
          <td>${$.format(s.operationDate)}</td>
          <td>${i}</td>
          <td>${s.quantity.value}</td>
          <td>${g.formatWithPrecision(s.pricePerShareUsd.amount)}</td>
          <td>${r.quantity.value}</td>
          <td>${g.formatWithPrecision(r.averagePriceUsd.amount)}</td>
          <td>${c.formatWithPrecision(r.averagePriceBrl(o).amount)}</td>
          <td class="${n&&n.amount>=0?"positive":n?"negative":""}">
            ${n?c.format(n.amount):"-"}
          </td>
        </tr>
      `}).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}static renderTaxSummary(t,e,a){if(e.length===0)return`
        <div class="detail-section">
          <h3>💰 Resumo para Imposto de Renda</h3>
          <div class="tax-info">
            <p>✅ Nenhuma venda realizada em ${t}</p>
            <p>Não há lucro ou prejuízo a declarar para este ano.</p>
          </div>
        </div>
      `;const s=new Map;e.forEach(o=>{const i=o.metadata.operationDate.getMonth();s.has(i)||s.set(i,[]),s.get(i).push(o)});const r=Array.from(s.entries()).sort(([o],[i])=>o-i).map(([o,i])=>{const n=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],l=i.reduce((u,m)=>u+(m.metadata.tradeFinancials?.saleRevenueBrl.amount??0),0),d=i.reduce((u,m)=>u+(m.metadata.tradeFinancials?.profitLossBrl.amount??0),0);return`
          <tr>
            <td>${n[o]}</td>
            <td>${i.length}</td>
            <td>${c.format(l)}</td>
            <td class="${d>=0?"positive":"negative"}">
              ${c.format(d)}
            </td>
          </tr>
        `}).join("");return`
      <div class="detail-section">
        <h3>💰 Resumo para Imposto de Renda ${t}</h3>
        
        <div class="tax-summary-cards">
          <div class="tax-card">
            <div class="tax-label">Lucro/Prejuízo Total do Ano</div>
            <div class="tax-value ${a>=0?"positive":"negative"}">
              ${c.format(a)}
            </div>
            <div class="tax-detail">Todas as vendas</div>
          </div>
          
          <div class="tax-card">
            <div class="tax-label">Total de Vendas</div>
            <div class="tax-value">${e.length}</div>
            <div class="tax-detail">Operações de venda</div>
          </div>
          
          <div class="tax-card">
            <div class="tax-label">Total Vendido (BRL)</div>
            <div class="tax-value">
              ${c.format(e.reduce((o,i)=>o+(i.metadata.tradeFinancials?.saleRevenueBrl.amount??0),0))}
            </div>
            <div class="tax-detail">Valor bruto de vendas</div>
          </div>
        </div>

        <h4>Detalhamento Mensal</h4>
        <div class="operations-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th>Vendas</th>
                <th>Total Vendido (BRL)</th>
                <th>Lucro/Prejuízo</th>
              </tr>
            </thead>
            <tbody>
              ${r}
            </tbody>
          </table>
        </div>

        <div class="tax-info">
          <h4>ℹ️ Informações Importantes:</h4>
          <ul>
            <li><strong>Declaração:</strong> Todas as operações com ações devem ser declaradas no IRPF</li>
            <li><strong>Prejuízo:</strong> Pode ser compensado com lucros futuros em operações day-trade ou swing trade</li>
            <li><strong>Documentação:</strong> Guarde todos os comprovantes de compra e venda</li>
            <li><strong>Regime de tributação:</strong> Consulte a legislação vigente ou um contador</li>
          </ul>
          <p class="disclaimer">
            ⚠️ <strong>Atenção:</strong> Este é apenas um resumo das operações. 
            Consulte um contador para orientação fiscal precisa e atualizada sobre suas obrigações tributárias.
          </p>
        </div>
      </div>
    `}}class H{static createSchemaSection(){const t=this.getJSONSchema(),e=this.getJSONExample(),a=document.createElement("div");a.className="json-schema-section",a.innerHTML=`
      <div class="schema-toggle" id="schema-toggle">
        <div class="schema-toggle-text">
          <span>📋</span>
          <span>Ver Schema JSON</span>
        </div>
        <span class="schema-icon" id="schema-icon">▼</span>
      </div>
      <div class="schema-content" id="schema-content">
        <div class="schema-tabs">
          <button class="schema-tab active" data-tab="schema">Schema</button>
          <button class="schema-tab" data-tab="example">Exemplo</button>
        </div>
        <div class="schema-code" id="schema-display">
          <button class="copy-schema-btn" id="copy-schema-btn">Copiar</button>
          <pre>${this.escapeHtml(t)}</pre>
        </div>
      </div>
    `;const s=a.querySelector("#schema-toggle"),r=a.querySelector("#schema-content"),o=a.querySelector("#schema-icon"),i=a.querySelector("#schema-display pre"),n=a.querySelector("#copy-schema-btn"),l=a.querySelectorAll(".schema-tab");return s.addEventListener("click",()=>{const d=r.classList.toggle("open");o.classList.toggle("open",d)}),n.addEventListener("click",()=>{const d=i.textContent||"";navigator.clipboard.writeText(d).then(()=>{n.textContent="Copiado!",setTimeout(()=>{n.textContent="Copiar"},2e3)})}),l.forEach(d=>{d.addEventListener("click",()=>{l.forEach(m=>m.classList.remove("active")),d.classList.add("active"),d.getAttribute("data-tab")==="example"?i.textContent=e:i.textContent=t})}),a}static getJSONSchema(){return JSON.stringify({$schema:"http://json-schema.org/draft-07/schema#",type:"array",description:"Lista de operações de portfólio (vesting ou trade)",items:{oneOf:[{type:"object",description:"Operação de Vesting (aquisição de ações)",required:["type","date","quantity","price_per_share_usd"],properties:{type:{type:"string",const:"vesting",description:"Tipo da operação"},date:{type:"string",format:"date",description:"Data da operação (YYYY-MM-DD)"},quantity:{type:"integer",minimum:1,description:"Quantidade de ações"},price_per_share_usd:{type:"number",minimum:0,description:"Preço por ação em USD"}}},{type:"object",description:"Operação de Trade (venda de ações)",required:["type","date","quantity","price_per_share_usd"],properties:{type:{type:"string",const:"trade",description:"Tipo da operação"},date:{type:"string",format:"date",description:"Data da operação (YYYY-MM-DD)"},settlement_date:{type:"string",format:"date",description:"Data de liquidação (opcional, padrão = date)"},quantity:{type:"integer",minimum:1,description:"Quantidade de ações vendidas"},price_per_share_usd:{type:"number",minimum:0,description:"Preço de venda por ação em USD"}}}]}},null,2)}static getJSONExample(){return JSON.stringify([{type:"vesting",date:"2023-01-15",quantity:100,price_per_share_usd:8.5},{type:"vesting",date:"2023-04-15",quantity:100,price_per_share_usd:9.2},{type:"trade",date:"2023-06-10",settlement_date:"2023-06-12",quantity:50,price_per_share_usd:10.75},{type:"vesting",date:"2023-07-15",quantity:100,price_per_share_usd:11},{type:"trade",date:"2023-12-20",settlement_date:"2023-12-22",quantity:150,price_per_share_usd:12.5}],null,2)}static escapeHtml(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}}class W{constructor(t,e,a,s,r,o,i,n,l,d,u,m,v,f){this.tradeInput=t,this.tradeButton=e,this.tradeCount=a,this.releaseInput=s,this.releaseButton=r,this.releaseCount=o,this.jsonInput=i,this.processButton=n,this.exportButton=l,this.clearButton=d,this.resultsContainer=u,this.uploadSection=m,this.resetSection=v,this.resetButton=f,this.setupEventListeners(),this.setupJSONSchemaDisplay()}tradePDFs=[];releasePDFs=[];jsonFile=null;snapshots=[];setupJSONSchemaDisplay(){const t=document.querySelector(".upload-group:has(#json-file)");if(t){const e=H.createSchemaSection();t.appendChild(e)}}setupEventListeners(){this.tradeButton.addEventListener("click",()=>{this.tradeInput.click()}),this.tradeInput.addEventListener("change",()=>{const t=Array.from(this.tradeInput.files??[]);this.tradePDFs=t.filter(e=>e.name.toLowerCase().endsWith(".pdf")),this.updateFileCount(this.tradeCount,this.tradePDFs.length),this.updateButtonStates(),this.showTotalFileCount()}),this.releaseButton.addEventListener("click",()=>{this.releaseInput.click()}),this.releaseInput.addEventListener("change",()=>{const t=Array.from(this.releaseInput.files??[]);this.releasePDFs=t.filter(e=>e.name.toLowerCase().endsWith(".pdf")),this.updateFileCount(this.releaseCount,this.releasePDFs.length),this.updateButtonStates(),this.showTotalFileCount()}),this.jsonInput.addEventListener("change",()=>{this.jsonFile=this.jsonInput.files?.[0]??null,this.updateButtonStates()}),this.processButton.addEventListener("click",()=>{this.processPortfolio()}),this.exportButton.addEventListener("click",()=>{this.processPortfolio(!0)}),this.clearButton.addEventListener("click",()=>{this.clearAll()}),this.resetButton.addEventListener("click",()=>{this.resetAndShowUpload()})}updateFileCount(t,e){e>0?(t.textContent=`${e} file${e>1?"s":""} selected`,t.style.color="#28a745"):t.textContent=""}showTotalFileCount(){if(this.tradePDFs.length+this.releasePDFs.length>0){const e=this.getUniqueFolders(this.tradePDFs),a=this.getUniqueFolders(this.releasePDFs);let s="";(e.size>1||a.size>1)&&(s='<br><small style="color: #6c757d;">Including files from subfolders</small>'),this.resultsContainer.innerHTML=`
        <div class="info-message">
          <strong>📁 Files loaded:</strong> 
          ${this.tradePDFs.length} trade confirmation(s), 
          ${this.releasePDFs.length} release confirmation(s)
          ${s}
        </div>
      `}}getUniqueFolders(t){const e=new Set;return t.forEach(a=>{const s=a.webkitRelativePath||a.name,r=s.substring(0,s.lastIndexOf("/"));r&&e.add(r)}),e}updateButtonStates(){const t=this.tradePDFs.length>0||this.releasePDFs.length>0||this.jsonFile!==null;this.processButton.disabled=!t,this.exportButton.disabled=!t}async processPortfolio(t=!1){try{this.showLoading();const e=[],a=3;let s=0;if(this.jsonFile){this.updateProgress(s,a,"Carregando arquivo JSON...");const m=await this.readFileAsText(this.jsonFile);e.push(new k(m)),s++}if(this.tradePDFs.length>0||this.releasePDFs.length>0){const m=this.tradePDFs.length+this.releasePDFs.length;this.updateProgress(s,a,`Carregando ${m} arquivos PDF...`);const v=new Y(this.tradePDFs,this.releasePDFs,(f,w)=>{this.updateProgress(s,a,`Processando PDFs: ${f}/${w}`)});e.push(v),s++}this.updateProgress(s,a,"Calculando portfólio...");const r=new _(e),o=new I,i=new A(o),n=new M,l=t?new V:void 0,u=await new O(r,i,n,l).execute({exportData:t});this.snapshots=u.snapshots,this.displayResults(u)}catch(e){this.showError(e instanceof Error?e.message:"Unknown error occurred")}}showLoading(){this.resultsContainer.innerHTML=`
      <div class="loading">
        <div class="spinner"></div>
        <p>Processando operações do portfólio...</p>
        <div class="progress-container">
          <div class="progress-bar" id="progressBar"></div>
        </div>
        <p class="progress-text" id="progressText">Inicializando...</p>
      </div>
    `}updateProgress(t,e,a){const s=document.getElementById("progressBar"),r=document.getElementById("progressText");if(s&&r){const o=e>0?t/e*100:0;s.style.width=`${o}%`,r.textContent=`${a} (${t}/${e})`}}showError(t){this.resultsContainer.innerHTML=`
      <div class="error">
        <strong>Erro:</strong> ${this.escapeHtml(t)}
      </div>
    `}displayResults(t){const{finalPosition:e,snapshots:a,totalOperations:s,totalReturnBrl:r}=t;this.uploadSection.classList.add("hidden"),this.resetSection.style.display="block";const o=this.getYearlySnapshots(a);this.resultsContainer.innerHTML=`
      <div class="results">
        <h2>Resumo do Portfólio</h2>
        
        <div class="summary-cards">
          <div class="card">
            <h3>Total de Operações</h3>
            <div class="value">${s}</div>
          </div>
          
          <div class="card">
            <h3>Posição Atual</h3>
            <div class="value">${e.quantity.value} ações</div>
          </div>
          
          <div class="card">
            <h3>Preço Médio (USD)</h3>
            <div class="value">${g.format(e.averagePriceUsd.amount)}</div>
          </div>
          
          <div class="card">
            <h3>Retorno Total (BRL)</h3>
            <div class="value ${r.amount>=0?"positive":"negative"}">
              ${c.format(r.amount)}
            </div>
          </div>
        </div>

        <h2>Resumo Anual <small style="color: #6c757d;">(Clique em qualquer ano para ver detalhes)</small></h2>
        <div class="operations-table">
          ${this.renderYearlyTable(o)}
        </div>

        <h2>Histórico de Operações <small style="color: #6c757d;">(Clique em qualquer linha para ver detalhes)</small></h2>
        <div class="operations-table">
          ${this.renderOperationsTable(a)}
        </div>
      </div>
    `,this.attachOperationClickHandlers(),this.attachYearClickHandlers()}attachOperationClickHandlers(){this.resultsContainer.querySelectorAll("tbody tr[data-operation-index]").forEach(e=>{e.addEventListener("click",()=>{const a=parseInt(e.getAttribute("data-operation-index")||"0");this.showOperationDetails(a)})})}attachYearClickHandlers(){this.resultsContainer.querySelectorAll("tbody tr[data-year]").forEach(e=>{e.addEventListener("click",()=>{const a=parseInt(e.getAttribute("data-year")||"0");this.showYearDetails(a)})})}getYearlySnapshots(t){const e=new Map;for(const a of t){const s=a.position.lastUpdated.getFullYear(),r=e.get(s);(!r||a.position.lastUpdated>=r.position.lastUpdated)&&e.set(s,a)}return e}renderYearlyTable(t){return`
      <table>
        <thead>
          <tr>
            <th>Ano</th>
            <th>Quantidade</th>
            <th>Custo Total (USD)</th>
            <th>Preço Médio (USD)</th>
            <th>Custo Total (BRL)</th>
            <th>Preço Médio (BRL)</th>
            <th>Lucro Bruto (BRL)</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from(t.keys()).sort((s,r)=>s-r).map(s=>{const r=t.get(s),o=r.position,i=r.metadata.exchangeRates.ptaxBid;return`
        <tr data-year="${s}" style="cursor: pointer;">
          <td>${s}</td>
          <td>${o.quantity.value}</td>
          <td>${g.format(o.totalCostUsd.amount)}</td>
          <td>${g.formatWithPrecision(o.averagePriceUsd.amount)}</td>
          <td>${c.format(o.totalCostBrl.amount)}</td>
          <td>${c.formatWithPrecision(o.averagePriceBrl(i).amount)}</td>
          <td class="${o.grossProfitBrl.amount>=0?"positive":"negative"}">
            ${c.format(o.grossProfitBrl.amount)}
          </td>
        </tr>
      `}).join("")}
        </tbody>
      </table>
    `}renderOperationsTable(t){return`
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Operação</th>
            <th>Quantidade Final</th>
            <th>Preço Médio (USD)</th>
            <th>Preço Médio (BRL)</th>
            <th>Lucro Bruto (BRL)</th>
          </tr>
        </thead>
        <tbody>
          ${t.map((a,s)=>{const r=a.position,o=a.metadata,i=a.getOperationDescription(),n=o.exchangeRates.ptaxBid;return`
        <tr data-operation-index="${s}">
          <td>${$.format(o.operationDate)}</td>
          <td>${i}</td>
          <td>${r.quantity.value}</td>
          <td>${g.formatWithPrecision(r.averagePriceUsd.amount)}</td>
          <td>${c.formatWithPrecision(r.averagePriceBrl(n).amount)}</td>
          <td class="${r.grossProfitBrl.amount>=0?"positive":"negative"}">
            ${c.format(r.grossProfitBrl.amount)}
          </td>
        </tr>
      `}).join("")}
        </tbody>
      </table>
    `}showOperationDetails(t){const e=this.snapshots[t];if(!e)return;const a=j.createOperationModal(e);this.showModal(a)}showYearDetails(t){const e=this.snapshots.filter(s=>s.position.lastUpdated.getFullYear()===t);if(e.length===0)return;const a=N.createYearModal(t,e);this.showModal(a)}showModal(t){const e=document.activeElement;document.body.appendChild(t),t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true");const a=t.querySelector(".modal-close"),s=t;a&&a.focus();const r=()=>{t.remove(),e&&e.focus()};a?.addEventListener("click",r),s.addEventListener("click",o=>{o.target===s&&r()}),document.addEventListener("keydown",function o(i){i.key==="Escape"&&(r(),document.removeEventListener("keydown",o))})}clearAll(){this.tradePDFs=[],this.releasePDFs=[],this.jsonFile=null,this.snapshots=[],this.tradeInput.value="",this.releaseInput.value="",this.jsonInput.value="",this.tradeCount.textContent="",this.releaseCount.textContent="",this.resultsContainer.innerHTML="",this.updateButtonStates()}resetAndShowUpload(){this.clearAll(),this.resetSection.style.display="none",this.uploadSection.classList.remove("hidden"),window.scrollTo({top:0,behavior:"smooth"})}async readFileAsText(t){return new Promise((e,a)=>{const s=new FileReader;s.onload=r=>e(r.target?.result),s.onerror=()=>a(new Error("Failed to read file")),s.readAsText(t)})}escapeHtml(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}}document.addEventListener("DOMContentLoaded",()=>{const p=document.getElementById("trade-pdfs"),t=document.getElementById("trade-btn"),e=document.getElementById("trade-count"),a=document.getElementById("release-pdfs"),s=document.getElementById("release-btn"),r=document.getElementById("release-count"),o=document.getElementById("json-file"),i=document.getElementById("process-btn"),n=document.getElementById("export-btn"),l=document.getElementById("clear-btn"),d=document.getElementById("results"),u=document.getElementById("upload-section"),m=document.getElementById("reset-section"),v=document.getElementById("reset-btn");new W(p,t,e,a,s,r,o,i,n,l,d,u,m,v)});
//# sourceMappingURL=index-CORdmOZ-.js.map
