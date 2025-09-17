import { StudyPayLogo } from '@/assets'
import Image from 'next/image'
import React from 'react'

function Logo() {
  return (
    <div className="flex items-center">
        <Image src={StudyPayLogo} alt="StudyPay Logo" width={50} height={50} />
        <span className="hidden md:block ml-2 text-sm text-dark-text-secondary">Solana Campus Payments</span>
    </div>
  )
}

export default Logo