import {GET,POST,PUT} from '../app/api/[...path]/route';
export default {fetch(req:Request){return ({GET,POST,PUT} as any)[req.method]?.(req)||new Response('Not allowed',{status:405})}};
