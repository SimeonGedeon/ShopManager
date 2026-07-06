import React, { useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { objectifService } from '../api/client';
import { formatCurrency } from '../utils/format';
import { colors, spacing } from '../theme';

export default function ObjectifsScreen() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [form, setForm] = useState({ date: '', libelle: '', montant: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['objectifs'],
    queryFn: () => objectifService.getSemaine().then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: () => objectifService.updateJour(editId!, { benefice_credits: parseInt(editVal) || 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['objectifs'] }); setEditId(null); },
  });

  const addMutation = useMutation({
    mutationFn: () => objectifService.addRevenu({ ...form, montant: parseInt(form.montant) || 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['objectifs'] }); setForm({ date: '', libelle: '', montant: '' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => objectifService.deleteRevenu(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['objectifs'] }),
  });

  const obj = data?.data || {};
  const jours = obj.jours || [];
  const progression = Math.min(obj.progression || 0, 100);

  return (
    <View style={s.main}>
      <View style={s.header}><Text style={s.title}>🎯 Objectifs</Text><Text style={s.sub}>Semaine {obj.semaine}</Text></View>
      <ScrollView style={s.content} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
        <View style={s.r}><View style={s.st}><Text style={s.sl}>Objectif</Text><Text style={s.sv}>{formatCurrency(obj.objectif_hebdomadaire || 0)}</Text></View><View style={s.st}><Text style={s.sl}>Réalisé</Text><Text style={[s.sv,{color:colors.success}]}>{formatCurrency(obj.total_general || 0)}</Text></View></View>
        <View style={s.r}><View style={s.st}><Text style={s.sl}>Reste</Text><Text style={[s.sv,{color:colors.warning}]}>{formatCurrency(obj.reste || 0)}</Text></View><View style={s.st}><Text style={s.sl}>Progression</Text><Text style={[s.sv,{color:colors.primary}]}>{progression}%</Text></View></View>
        <View style={s.bar}><View style={[s.fill,{width:`${progression}%`}]}/></View>

        {jours.map((jour: any) => (
          <View key={jour.date} style={s.card}>
            <TouchableOpacity style={s.jh} onPress={() => setExpanded(expanded===jour.date?null:jour.date)}>
              <View><Text style={s.jn}>{jour.jour}</Text><Text style={s.jd}>{jour.date}</Text></View>
              <Text style={s.jt}>{formatCurrency(jour.total_jour)}</Text>
            </TouchableOpacity>
            {expanded===jour.date && (
              <View style={s.jd2}>
                <View style={s.rw}><Text style={s.lb}>Crédits</Text>
                  {editId===jour.id ? (
                    <View style={{flexDirection:'row',gap:4}}><TextInput style={[s.in,{width:80,marginBottom:0,padding:6}]} keyboardType="numeric" value={editVal} onChangeText={setEditVal}/><TouchableOpacity onPress={()=>updateMutation.mutate()}><Text>✅</Text></TouchableOpacity></View>
                  ) : (
                    <TouchableOpacity onPress={()=>{setEditId(jour.id);setEditVal(String(jour.benefice_credits));}}><Text style={s.vl}>{formatCurrency(jour.benefice_credits)} ✏️</Text></TouchableOpacity>
                  )}
                </View>
                {jour.autres_revenus?.map((r:any)=>(
                  <View key={r.id} style={s.rw}><Text style={s.lb}>{r.libelle}</Text><View style={{flexDirection:'row',gap:8,alignItems:'center'}}><Text style={[s.vl,{color:colors.success}]}>+{formatCurrency(r.montant)}</Text><TouchableOpacity onPress={()=>deleteMutation.mutate(r.id)}><Text style={{color:colors.danger}}>✕</Text></TouchableOpacity></View></View>
                ))}
                <TouchableOpacity onPress={()=>setForm({...form,date:jour.date})}><Text style={{color:colors.primary,fontSize:12,marginTop:8}}>+ Ajouter revenu</Text></TouchableOpacity>
                {form.date===jour.date && (
                  <View style={{flexDirection:'row',gap:4,marginTop:8}}><TextInput style={[s.in,{flex:1,marginBottom:0,padding:8}]} placeholder="Libellé" value={form.libelle} onChangeText={v=>setForm({...form,libelle:v})}/><TextInput style={[s.in,{width:70,marginBottom:0,padding:8}]} placeholder="FC" keyboardType="numeric" value={form.montant} onChangeText={v=>setForm({...form,montant:v})}/><TouchableOpacity onPress={()=>addMutation.mutate()}><Text>✅</Text></TouchableOpacity></View>
                )}
              </View>
            )}
          </View>
        ))}
        <View style={{height:40}}/>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  main:{flex:1,backgroundColor:'#0F172A'},header:{paddingHorizontal:spacing.lg,paddingTop:50,paddingBottom:20},title:{fontSize:22,fontWeight:'bold',color:'#FFF'},sub:{fontSize:12,color:'#94A3B8',marginTop:2},
  content:{flex:1,backgroundColor:'#F1F5F9',borderTopLeftRadius:24,borderTopRightRadius:24,padding:spacing.md},
  r:{flexDirection:'row',gap:spacing.sm,marginBottom:spacing.sm},st:{flex:1,backgroundColor:'#FFF',borderRadius:12,padding:spacing.md,borderWidth:1,borderColor:'#E2E8F0',alignItems:'center'},
  sl:{fontSize:11,color:'#64748B'},sv:{fontSize:18,fontWeight:'800',color:'#1E293B',marginTop:4},
  bar:{height:8,backgroundColor:'#E2E8F0',borderRadius:4,marginBottom:spacing.md},fill:{height:8,backgroundColor:colors.primary,borderRadius:4},
  card:{backgroundColor:'#FFF',borderRadius:14,marginBottom:spacing.sm,borderWidth:1,borderColor:'#E2E8F0',overflow:'hidden'},
  jh:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:spacing.md},
  jn:{fontSize:14,fontWeight:'700',color:'#1E293B',textTransform:'capitalize'},jd:{fontSize:11,color:'#94A3B8'},jt:{fontSize:14,fontWeight:'700',color:colors.primary},
  jd2:{padding:spacing.md,borderTopWidth:1,borderTopColor:'#E2E8F0',backgroundColor:'#F8FAFC'},
  rw:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:4},
  lb:{fontSize:13,color:'#64748B'},vl:{fontSize:13,fontWeight:'600',color:'#1E293B'},
  in:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#E2E8F0',borderRadius:8,padding:8,fontSize:13,color:'#1E293B',marginBottom:spacing.sm},
});
