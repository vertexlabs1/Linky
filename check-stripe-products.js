import Stripe from 'stripe'

// Load environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required')
  console.log('Please set it in your environment:')
  console.log('export STRIPE_SECRET_KEY="your_stripe_secret_key_here"')
  console.log('Get this from: Stripe Dashboard → Developers → API Keys → Secret key')
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY)

async function checkStripeProducts() {
  console.log('🔍 Checking current Stripe products...')
  
  try {
    // Get all products
    const products = await stripe.products.list({
      limit: 100
    })
    
    console.log('\n📊 Current Products:')
    for (const product of products.data) {
      console.log(`\n🏷️  Product: ${product.name}`)
      console.log(`   ID: ${product.id}`)
      console.log(`   Description: ${product.description || 'No description'}`)
      console.log(`   Active: ${product.active}`)
      console.log(`   Metadata:`, product.metadata)
      
      // Get prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        limit: 100
      })
      
      console.log(`   💰 Prices:`)
      prices.data.forEach(price => {
        console.log(`      - ${price.unit_amount / 100} ${price.currency.toUpperCase()} / ${price.recurring?.interval || 'one-time'}`)
        console.log(`        Price ID: ${price.id}`)
        console.log(`        Active: ${price.active}`)
      })
    }
    
    console.log('\n📋 Recommendations:')
    console.log('1. Create separate products for promo vs regular billing')
    console.log('2. Use clear naming: "Linky Founding Member (Promo)" and "Linky Prospector"')
    console.log('3. Add metadata to distinguish billing phases')
    
  } catch (error) {
    console.error('❌ Error checking products:', error.message)
  }
}

checkStripeProducts() 