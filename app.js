const promptBox=document.querySelector("#prompts");
const countBox=document.querySelector("#count");
const promptCount=document.querySelector("#promptCount");
const imageCount=document.querySelector("#imageCount");
const statusBox=document.querySelector("#status");
const KEY="flowBulkStudioBatch";

function getPrompts(){
  return promptBox.value.split(/\n\s*\n+/).map(x=>x.trim()).filter(Boolean).slice(0,20);
}
function update(){
  const list=getPrompts(), per=Number(countBox.value);
  promptCount.textContent=list.length;
  imageCount.textContent=list.length*per;
}
function batch(){
  return {schemaVersion:1,createdAt:new Date().toISOString(),imagesPerPrompt:Number(countBox.value),prompts:getPrompts().map((text,i)=>({id:`prompt-${i+1}`,text,count:Number(countBox.value)}))};
}
promptBox.addEventListener("input",update);
countBox.addEventListener("change",update);
document.querySelector("#save").addEventListener("click",()=>{
  const b=batch(); localStorage.setItem(KEY,JSON.stringify(b));
  statusBox.textContent=b.prompts.length?`Saved ${b.prompts.length} prompts on this device.`:"Paste at least one prompt first.";
});
document.querySelector("#export").addEventListener("click",()=>{
  const b=batch(); if(!b.prompts.length){statusBox.textContent="Paste at least one prompt first.";return;}
  const blob=new Blob([JSON.stringify(b,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="flow-bulk-studio-batch.json";a.click();URL.revokeObjectURL(url);
  statusBox.textContent="Batch exported. Import this JSON in the desktop extension.";
});
document.querySelector("#import").addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const b=JSON.parse(await file.text());
    if(!Array.isArray(b.prompts))throw new Error("Invalid batch");
    promptBox.value=b.prompts.map(p=>p.text).join("\n\n");
    countBox.value=String(b.imagesPerPrompt||b.prompts[0]?.count||2);
    update();statusBox.textContent=`Imported ${getPrompts().length} prompts.`;
  }catch{statusBox.textContent="Could not read this batch file."}
});
try{
  const saved=JSON.parse(localStorage.getItem(KEY)||"null");
  if(saved?.prompts){promptBox.value=saved.prompts.map(p=>p.text).join("\n\n");countBox.value=String(saved.imagesPerPrompt||2)}
}catch{}
update();
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}


// PWA install prompt (available in supported browsers when served over HTTPS).
let installPrompt = null;
const installButton = document.querySelector("#installApp");
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  if (installButton) installButton.hidden = false;
});
if (installButton) {
  installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
}
window.addEventListener("appinstalled", () => {
  if (installButton) installButton.hidden = true;
  statusBox.textContent = "Flow Bulk Studio installed on this device.";
});
