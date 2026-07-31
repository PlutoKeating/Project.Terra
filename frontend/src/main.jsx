import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const types = ['service','database','cache','queue','external','infrastructure']
const protocols = ['http_rest','grpc','graphql','websocket','amqp','kafka','database','custom']
const modes = ['sync_request_response','async_message','one_way_notification','publish_subscribe','event_broadcast']

async function request(path, options={}) { const r = await fetch(API + path, {headers:{'Content-Type':'application/json'}, ...options}); if (!r.ok) throw new Error((await r.json()).detail || r.statusText); return r.status === 204 ? null : r.json() }
function App() {
  const [projects,setProjects]=useState([]), [project,setProject]=useState(null), [selected,setSelected]=useState(null), [error,setError]=useState(''), [validation,setValidation]=useState([])
  const refresh=()=>request('/projects').then(setProjects).catch(e=>setError(e.message))
  useEffect(refresh,[])
  const create=async()=>{const p=await request('/projects',{method:'POST',body:JSON.stringify({name:'新架构'})}); setProjects([...projects,p]); setProject(p)}
  const addNode=async()=>{if(!project)return; const n=await request(`/projects/${project.id}/nodes`,{method:'POST',body:JSON.stringify({type:'service',label:'新服务',position:{x:120+project.nodes.length*220,y:160}})}); const p={...project,nodes:[...project.nodes,n]};setProject(p);setSelected(n)}
  const saveNode=async(e)=>{e.preventDefault();const n=await request(`/projects/${project.id}/nodes/${selected.id}`,{method:'PUT',body:JSON.stringify(selected)});setProject({...project,nodes:project.nodes.map(x=>x.id===n.id?n:x)});setSelected(n)}
  const validate=async()=>setValidation(await request(`/projects/${project.id}/validate`,{method:'POST'}))
  return <div className="app"><header><h1>Terra</h1><span>架构描述画布</span><button onClick={create}>新建项目</button></header><main><aside><h2>项目</h2>{projects.map(p=><button className="project" onClick={()=>setProject(p)} key={p.id}>{p.name}</button>)}<button onClick={refresh}>刷新</button></aside><section><div className="toolbar"><strong>{project?.name||'请选择项目'}</strong>{project&&<><button onClick={addNode}>添加节点</button><button onClick={validate}>验证</button></>}</div><div className="canvas">{project?.nodes.map(n=><button className={'node '+n.type+(selected?.id===n.id?' selected':'')} style={{left:n.position.x,top:n.position.y}} onClick={()=>setSelected(n)} key={n.id}><b>{n.label}</b><small>{n.type}</small></button>)}</div>{validation.length>0&&<div className="results"><h3>验证结果</h3>{validation.map((v,i)=><div className={v.severity} key={i}>{v.message}</div>)}</div>}</section><aside className="inspector"><h2>属性</h2>{selected?<form onSubmit={saveNode}><label>名称<input value={selected.label} onChange={e=>setSelected({...selected,label:e.target.value})}/></label><label>类型<select value={selected.type} onChange={e=>setSelected({...selected,type:e.target.value})}>{types.map(x=><option key={x}>{x}</option>)}</select></label><label>X<input type="number" value={selected.position.x} onChange={e=>setSelected({...selected,position:{...selected.position,x:+e.target.value}})}/></label><label>Y<input type="number" value={selected.position.y} onChange={e=>setSelected({...selected,position:{...selected.position,y:+e.target.value}})}/></label><button>保存节点</button></form>:<p>点击画布节点查看属性</p>}</aside></main>{error&&<div className="error">{error}</div>}</div>
}
createRoot(document.getElementById('root')).render(<App />)
