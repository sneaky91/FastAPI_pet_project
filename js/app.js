const API='http://localhost:8000';
const chat=document.querySelector('#chat');
const input=document.querySelector('#prompt');
const send=document.querySelector('#send');
const historyList=document.querySelector('#historyList');
const statusDot=document.querySelector('#statusDot');
const statusText=document.querySelector('#statusText');
const makeId=()=>crypto.randomUUID?crypto.randomUUID():'chat-'+Date.now()+'-'+Math.random().toString(16).slice(2);
let activeChatId=localStorage.getItem('active-chat-id')||makeId();
let messages=[];
let chats={};
let busy=false;

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const titleOf=list=>((list.find(item=>item.role==='user')||{}).text||'New chat').slice(0,36);

function saveLocal(){localStorage.setItem('active-chat-id',activeChatId);localStorage.setItem('gemini-chat',JSON.stringify(messages))}
function renderMessages(){if(!messages.length){chat.innerHTML='<div class="welcome"><div class="star">✦</div><h2>How can I help?</h2><p>Your new chat is ready. Send a message to get started.</p><div class="suggestions"><button class="suggestion">Explain a complex topic simply</button><button class="suggestion">Help me plan a project</button><button class="suggestion">Give me an app idea</button><button class="suggestion">Check my text for mistakes</button></div></div>';document.querySelectorAll('.suggestion').forEach(button=>button.onclick=()=>{input.value=button.textContent;resize();input.focus()});return}chat.innerHTML=messages.map(item=>'<article class="message '+item.role+'"><div class="avatar">'+(item.role==='user'?'You':'✦')+'</div><div class="message-body"><div class="meta">'+(item.role==='user'?'You':'Gemini')+'</div><div class="bubble">'+esc(item.text)+'</div></div></article>').join('');chat.scrollTop=chat.scrollHeight}
function renderHistory(){let ids=Object.keys(chats);historyList.innerHTML=ids.length?ids.map(id=>'<div class="history-row"><button class="history-item '+(id===activeChatId?'active':'')+'" data-id="'+esc(id)+'" title="'+esc(chats[id].title)+'">'+esc(chats[id].title)+'</button><button class="delete-chat" data-delete="'+esc(id)+'" title="Delete chat"><img src="./assets/bin.png" alt="Delete"></button></div>').join(''):'<div class="empty">No saved chats yet</div>';historyList.querySelectorAll('.history-item').forEach(button=>button.onclick=()=>selectChat(button.dataset.id));historyList.querySelectorAll('.delete-chat').forEach(button=>button.onclick=event=>deleteChat(button.dataset.delete,event))}
function updateActive(){chats[activeChatId]={id:activeChatId,messages:[...messages],title:titleOf(messages)};saveLocal();renderHistory()}
function addMessage(role,text){messages.push({role,text});updateActive();renderMessages()}
function selectChat(id){activeChatId=id;messages=[...(chats[id]?.messages||[])];saveLocal();renderHistory();renderMessages()}
function newChat(){activeChatId=makeId();messages=[];saveLocal();renderHistory();renderMessages();input.focus()}
function resize(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,160)+'px'}
function lock(value){busy=value;send.disabled=value;input.disabled=value}
async function checkApi(){try{let response=await fetch(API+'/requests');if(!response.ok)throw Error();statusDot.classList.remove('off');statusText.textContent='API connected';return response}catch{statusDot.classList.add('off');statusText.textContent='API unavailable';return null}}
async function loadChats(){let response=await checkApi();if(!response)return;let rows=await response.json();chats={};rows.forEach(row=>{let id=row.conversation_id||'legacy';if(!chats[id])chats[id]={id,messages:[],title:''};chats[id].messages.push({role:'user',text:row.prompt||''},{role:'assistant',text:row.response||''});chats[id].title=titleOf(chats[id].messages)});if(chats[activeChatId])messages=[...chats[activeChatId].messages];else if(!messages.length&&chats.legacy){activeChatId='legacy';messages=[...chats.legacy.messages]}updateActive();renderMessages();renderHistory()}
async function deleteChat(id,event){event.stopPropagation();if(!confirm('Delete this chat permanently?'))return;try{let response=await fetch(API+'/requests/'+encodeURIComponent(id),{method:'DELETE'});if(!response.ok)throw Error('Delete request failed');delete chats[id];if(activeChatId===id){activeChatId=makeId();messages=[];saveLocal();renderMessages()}renderHistory()}catch(error){alert(error.message)}}
async function submit(event){event.preventDefault();let text=input.value.trim();if(!text||busy)return;addMessage('user',text);input.value='';resize();lock(true);let typing=document.createElement('article');typing.className='message';typing.innerHTML='<div class="avatar">✦</div><div class="message-body"><div class="meta">Gemini</div><div class="bubble typing"><i></i><i></i><i></i></div></div>';chat.append(typing);chat.scrollTop=chat.scrollHeight;try{let response=await fetch(API+'/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:text,conversation_id:activeChatId})});let data=await response.json();if(!response.ok)throw Error(data.detail||'Server error');typing.remove();addMessage('assistant',data.answer||'The server returned an empty answer.')}catch(error){typing.remove();addMessage('assistant','Could not get an answer. '+error.message)}finally{lock(false);input.focus();checkApi()}}

document.querySelector('#form').addEventListener('submit',submit);document.querySelector('#newChat').addEventListener('click',newChat);document.querySelector('#clearChat').addEventListener('click',()=>{messages=[];saveLocal();renderMessages();renderHistory()});input.addEventListener('input',resize);input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();document.querySelector('#form').requestSubmit()}});renderHistory();renderMessages();loadChats();

