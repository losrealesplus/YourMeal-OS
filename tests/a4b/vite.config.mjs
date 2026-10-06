import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, "../..");
const tenant = "10000000-0000-4000-8000-000000000001";
const customer = "30000000-0000-4000-8000-000000000001";
const dish = "40000000-0000-4000-8000-000000000001";
const order = "60000000-0000-4000-8000-000000000001";
const custom = (id) => ({
  id,
  tenant_id: tenant,
  order_id: order,
  dish_id: null,
  item_kind: "custom",
  name_snapshot: "Tarta",
  description_snapshot: null,
  allergen_state: "UNKNOWN",
  allergens_snapshot: [],
  snapshot_captured_at: "2026-10-05T12:00:00Z",
  qty: 1,
  day_date: "2026-10-06",
  unit_price: 18,
  price_snapshot_status: "captured",
  comment: null,
});
const source = {
  order: {
    id: order,
    tenant_id: tenant,
    customer_id: customer,
    week_start: "2026-10-05",
    status: "confirmed",
    demand_channel: "individual",
    revision: 4,
    write_contract_version: 2,
    notes: null,
  },
  items: [
    custom("80000000-0000-4000-8000-000000000001"),
    custom("80000000-0000-4000-8000-000000000002"),
  ],
};
const common = `const params = new URLSearchParams(location.search); window.a4bCalls ??= [];`;
export default defineConfig({
  root,
  plugins: [
    {
      name: "a4b-local-only-test-doubles",
      enforce: "pre",
      resolveId(id) {
        if (id === "@tenant-commercial") return "\0a4b-commercial";
      },
      load(id) {
        if (id === "\0a4b-commercial") return "export const hasTenantCommercial=false";
        if (id.endsWith("/src/hooks/use-auth.ts"))
          return `${common} export function useAuth(){ return { user:{id:'20000000-0000-4000-8000-000000000001'}, tenantId:'${tenant}', roles:[params.get('role') || 'company_admin'] }; }`;
        if (id.endsWith("/src/modules/orders/index.ts"))
          return "export const StaffOrderCaptureService={captureOrder(){throw new Error('Legacy write disabled in local UI fixture')}}";
        if (id.endsWith("/src/integrations/supabase/client.ts"))
          return `${common}
        const source=${JSON.stringify(source)};
        export const supabase={ from(table){ const filters={}; const response=async(single=false)=>{
          if(table==='feature_flags'){
            const flag=params.get('flag'); if(flag==='loading') await new Promise(()=>{});
            if(flag==='error') return {data:null,error:{message:'offline'}};
            return {data:flag==='closed'||flag==='missing'||flag==='global-only'?null:{enabled:true},error:null};
          }
          return {data:table==='orders'?source.order:table==='order_items'?source.items:single?null:[],error:null};
        };
        const chain={select(){return chain},eq(key,value){filters[key]=value;return chain},is(){return chain},or(){return chain},in(){return chain},order(){return chain},limit(){return chain},maybeSingle(){return response(true)},single(){return response(true)},then(resolve,reject){return response().then(resolve,reject)}};return chain; }};`;
        if (id.endsWith("/src/modules/weekly-menu/application/weekly-menu-queries.ts"))
          return `${common} export const fetchPublishedWeeklyMenu=async()=>params.get('menu')==='published'?{id:'50000000-0000-4000-8000-000000000001',weekStart:'2026-10-05',status:'published',days:[{dayDate:'2026-10-05',dishes:[{id:'${dish}',name:'Pollo sintético',price:11.9,emoji:'🍽️',allergens:[],tags:[]}]}]}:null;`;
        if (id.endsWith("/src/modules/orders/application/repeat-order-service.ts"))
          return `export const RepeatOrderService={preview:async()=>({targetWeekStart:'2026-10-05',available:[],unavailable:[],customProposals:${JSON.stringify(source.items.map((item) => ({ kind: "custom", sourceOrderItemId: item.id, sourceItemIdentity: `custom:${item.id}`, dishId: null, name: item.name_snapshot, description: null, qty: 1, targetDayDate: "2026-10-06", unitPrice: null })))}})};`;
        if (id.endsWith("/src/modules/weekly-menu/application/offer-write.functions.ts"))
          return `${common}
        function result(request){return {order:{id:'${order}',tenant_id:request.tenantId,customer_id:request.command.customer?.id || '${customer}',week_start:request.command.weekStart,status:'confirmed',revision:request.command.operation==='modify'?request.command.expectedRevision+1:1,write_contract_version:2},items:request.command.lines.map((line,index)=>({id:line.lineId || crypto.randomUUID(),tenant_id:request.tenantId,order_id:'${order}',item_kind:line.kind,dish_id:line.kind==='custom'?null:line.dishId,name_snapshot:line.name||'Plato',description_snapshot:line.description||null,qty:line.qty,day_date:line.dayDate,unit_price:line.unitPrice||'11.90',price_snapshot_status:Number(line.unitPrice)===0?'explicit_zero':'captured',allergen_state:'UNKNOWN',allergens_snapshot:[],snapshot_captured_at:'2026-10-05T12:00:00Z'})),committedRevision:request.command.operation==='modify'?request.command.expectedRevision+1:1,replayed:false,inputHash:'a'.repeat(64)}}
        export async function quoteOfferOrder({data}){window.a4bCalls.push({kind:'quote',request:structuredClone(data)});return {quoteId:crypto.randomUUID(),total:'29.90',lines:data.command.lines.filter(l=>l.kind==='dish').map(l=>({...l,unitPrice:'11.90'}))};}
        export async function commitCustomOrder({data}){window.a4bCalls.push({kind:'custom',request:structuredClone(data)});if(params.get('failure')==='unknown'&&window.a4bCalls.length===1)throw new Error('timeout');return result(data)}
        export async function commitOfferOrder({data}){window.a4bCalls.push({kind:'mixed',request:structuredClone(data)});return result(data)};`;
      },
    },
    react(),
    tailwindcss(),
  ],
  optimizeDeps: { noDiscovery: true, include: ["react", "react-dom/client", "react/jsx-runtime"] },
  resolve: { alias: { "@": path.join(repo, "src") } },
  server: { host: "127.0.0.1", port: 4179, strictPort: true, fs: { allow: [repo] } },
});
