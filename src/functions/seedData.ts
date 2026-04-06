import { Context } from 'aws-lambda'
import { createHash } from 'crypto'
import { ulid } from 'ulid'
import { DynamoRecipeRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoRecipeRepository'
import { DynamoWarehouseRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoWarehouseRepository'
import { DynamoUserRepository } from '@core/infrastructure/repositories/DynamoDB/DynamoUserRepository'
import { VALID_INGREDIENTS } from '@core/domain/value-objects/IngredientName'
import { Recipe } from '@core/domain/aggregates/Recipe'
import { createUser } from '@core/domain/aggregates/User'
import { logger } from '@powertools/utilities'

// Composition Root
const recipeRepository = new DynamoRecipeRepository()
const warehouseRepository = new DynamoWarehouseRepository()
const userRepository = new DynamoUserRepository()

// Demo users
const DEMO_USERS = [
  { email: 'admin@restaurant-service.local', password: 'admin123' },
  { email: 'manager@restaurant-service.local', password: 'manager123' }
]

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

const RECIPES: Recipe[] = [
  {
    recipeId: ulid(),
    name: 'Tomato Salad',
    ingredients: [
      { name: 'tomato', quantity: 2 },
      { name: 'lettuce', quantity: 1 },
      { name: 'onion', quantity: 1 },
      { name: 'lemon', quantity: 1 }
    ]
  },
  {
    recipeId: ulid(),
    name: 'Grilled Chicken',
    ingredients: [
      { name: 'chicken', quantity: 1 },
      { name: 'lemon', quantity: 1 },
      { name: 'onion', quantity: 1 },
      { name: 'potato', quantity: 2 }
    ]
  },
  {
    recipeId: ulid(),
    name: 'Beef Burger',
    ingredients: [
      { name: 'meat', quantity: 1 },
      { name: 'cheese', quantity: 1 },
      { name: 'lettuce', quantity: 1 },
      { name: 'tomato', quantity: 1 },
      { name: 'ketchup', quantity: 1 }
    ]
  },
  {
    recipeId: ulid(),
    name: 'Chicken Rice Bowl',
    ingredients: [
      { name: 'chicken', quantity: 1 },
      { name: 'rice', quantity: 2 },
      { name: 'onion', quantity: 1 },
      { name: 'lemon', quantity: 1 }
    ]
  },
  {
    recipeId: ulid(),
    name: 'Cheese Potato',
    ingredients: [
      { name: 'potato', quantity: 3 },
      { name: 'cheese', quantity: 2 },
      { name: 'onion', quantity: 1 }
    ]
  },
  {
    recipeId: ulid(),
    name: 'Meat Stew',
    ingredients: [
      { name: 'meat', quantity: 1 },
      { name: 'tomato', quantity: 2 },
      { name: 'potato', quantity: 2 },
      { name: 'onion', quantity: 1 }
    ]
  }
]

export const handler = async (_event: unknown, _context: Context): Promise<void> => {
  try {
    logger.info('seedData: starting seed process')

    // Seed recipes
    logger.info('seedData: seeding recipes', { count: RECIPES.length })
    await recipeRepository.seedRecipes(RECIPES)

    // Seed initial warehouse inventory (5 units per ingredient)
    logger.info('seedData: seeding warehouse inventory', { count: VALID_INGREDIENTS.length })
    for (const ingredient of VALID_INGREDIENTS) {

      // Create initial inventory item directly in DynamoDB
      // We'll use the warehouse repository method that writes items
      const client = warehouseRepository['docClient']
      const tableName = warehouseRepository['tableName']

      await client.send(
        new (await import('@aws-sdk/lib-dynamodb')).PutCommand({
          TableName: tableName,
          Item: {
            PK: `INVENTORY#${ingredient}`,
            SK: 'METADATA',
            EntityType: 'Inventory',
            ingredientName: ingredient,
            availableQuantity: 5,
            reservedQuantity: 0,
            updatedAt: new Date().toISOString(),
            GSI2PK: 'TYPE#INVENTORY',
            GSI2SK: ingredient
          }
        })
      )
    }

    // Seed demo users
    logger.info('seedData: seeding demo users', { count: DEMO_USERS.length })
    for (const demoUser of DEMO_USERS) {
      try {
        const existingUser = await userRepository.getUserByEmail(demoUser.email)
        if (existingUser) {
          logger.info('seedData: user already exists, skipping', { email: demoUser.email })
          continue
        }

        const passwordHash = hashPassword(demoUser.password)
        const user = createUser(demoUser.email, passwordHash)
        await userRepository.createUser(user)

        logger.info('seedData: user created', {
          userId: user.userId,
          email: user.email
        })
      } catch (error) {
        logger.error('seedData: failed to create user', {
          email: demoUser.email,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    logger.info('seedData: seed process completed successfully')
  } catch (error) {
    logger.error('seedData: failed to seed data', { error })
    throw error
  }
}
