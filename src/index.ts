import { GraphQLServer } from 'graphql-yoga'
import { prisma } from './generated/prisma-client'
import { Context } from './utils'

const resolvers = {
  Query: {
    // drafts(parent, args, context: Context) {
    //   return context.prisma.posts({ where: { published: false } })
    // },
    // post(parent, { id }, context: Context) {
    //   return context.prisma.post({ id })
    // },
    async person(parent, { kennitala }, context: Context) {
      var p = await context.prisma.persons({ where: { kennitala: kennitala } })
      return p[0]
    },

    persons(parent, args, context: Context) {
      return context.prisma.persons()
    }
  },
  Mutation: {
    // createDraft(parent, { title, content }, context: Context) {
    //   return context.prisma.createPost({ title, content })
    // },
    // deletePost(parent, { id }, context: Context) {
    //   return context.prisma.deletePost({ id })
    // },
    // publish(parent, { id }, context: Context) {
    //   return context.prisma.updatePost({
    //     where: { id },
    //     data: { published: true },
    //   })
    // },
    async updateSumbission(parent, { data }, context: Context) {
      var frames = []
      var id = data.id
      var sub = await context.prisma.submission({ id }).timeframes()
      if (data.timeframes != null) {
        for (let item of data.timeframes) {
          frames.push({ start: item['start'], end: item['end'] })
        }

      }
      if (data.number_of_months == null) {
        return await context.prisma.updateSubmission({
          where: { id },
          data: { timeframes: { create: frames, deleteMany: sub } },
        }).$fragment(`
        fragment EnsureCity on Submission {
            id
            number_of_months
            timeframes {
              start
              end
            }
            person {
              name
            }
            payPerMonth
            payTotal
      }`)
      }
      var payPerMonth = await context.prisma.submission({ id }).payPerMonth()
      var payTotal = payPerMonth * data.number_of_months

      if (data.timeframes == null) {
        return await context.prisma.updateSubmission({
          where: { id },
          data: { number_of_months: data.number_of_months, payTotal: payTotal },
        }).$fragment(`
        fragment EnsureCity on Submission {
            id
            number_of_months
            timeframes {
              start
              end
            }
            person {
              name
            }
            payPerMonth
            payTotal
      }`)
      }
      return await context.prisma.updateSubmission({
        where: { id },
        data: { number_of_months: data.number_of_months, payTotal: payTotal, timeframes: { create: frames, deleteMany: sub }, },
      }).$fragment(`
      fragment EnsureCity on Submission {
          id
          number_of_months
          timeframes {
            start
            end
          }
          person {
            name
          }
          payPerMonth
          payTotal
    }`)
    },
    async createSubmission(parent, { kennitala, number_of_months, timeFrames }, context: Context) {
      var p = await context.prisma.persons({ where: { kennitala: kennitala } })
      var person = p[0]
      if (person == null) {
        return null
      }

      var id = person.id
      var frames = []
      var income = person.income * 0.8
      if (income < 184119) {
        income = 184199
      }

      if (income > 600000) {
        income = 600000
      }
      var payPerMonth = income - income * (person.income_tax_rate / 100) - income * (person.pension / 100) - income * (person.additional_pension / 100) - person.income * (person.union_fees / 100) + 54628 * (person.personal_discount / 100)
      var payTotal = payPerMonth * number_of_months


      for (let item of timeFrames) {
        frames.push({ start: item['start'], end: item['end'] })
      }
      return await context.prisma.createSubmission({ person: { connect: { id: id } }, number_of_months, payPerMonth, payTotal, timeframes: { create: frames } }).$fragment(`
      fragment EnsureCity on Submission {
          id
          number_of_months
          timeframes {
            start
            end
          }
          payPerMonth
          payTotal
          person {
            name
          }
    }`)
    },
    createPerson(parent, args, context: Context) {
      return context.prisma.createPerson(args)
    }
  },
}

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: { prisma },
})
server.start(() => console.log('Server is running on http://localhost:8000'))
