'use server'

// ⇧ Marking that all functions exported in this file are 
// server-side, hence not executed or sent to the client

import { z } from 'zod'
import { Invoice } from './definitions'
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const CreateInvoiceSchema = z.object({

    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    date: z.string(),
    status: z.enum(['pending', 'paid'])
})

const CreateInvoiceFormSchema = CreateInvoiceSchema.omit({
    id: true,
    date: true
})

export async function createInvoice(formData: FormData) {
    const {customerId, amount, status } = CreateInvoiceFormSchema.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })
     // ⇓ In case the form had a lot of fields, it could be done like this:
    // const rawFormData = Object.fromEntries(fromData.entries())

    //Transform to avoid rounding errors:
    const amountInCents = amount * 100

    //Create the current date:(yyyy-mm-dd)
    const [date] = new Date().toISOString().split('T')

    console.log({
        customerId,
        amountInCents,
        date,
        status
    })

    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
   
}
