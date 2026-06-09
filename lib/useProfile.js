'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setLoading(false)
    }
    init()
  }, [])

  const isAdmin = profile?.role === 'admin'
  const isPhotographer = profile?.role === 'photographer' || isAdmin
  const isMember = profile?.role === 'member' || isPhotographer
  const canUpload = isAdmin || isPhotographer
  const canInteract = isAdmin || isPhotographer || isMember

  return { profile, loading, isAdmin, isPhotographer, isMember, canUpload, canInteract }
}