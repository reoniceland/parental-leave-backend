import { GraphQLServer } from 'graphql-yoga'
import { prisma } from './generated/prisma-client'
import { Context } from './utils'

const resolvers = {
  Query: {
    async person(parent, { kennitala }, context: Context) {
      var p = await context.prisma.persons({ where: { kennitala: kennitala } })
      return p[0]
    },
    submission(parent, {id}, context:Context) {
      return context.prisma.submission({id})
    },
    persons(parent, args, context: Context) {
      return context.prisma.persons()
    },
    submissions(parent, {kennitala}, context: Context) {
      return context.prisma.submissions({where: {
        person:{kennitala:kennitala}
      }})
    }
  },
  Mutation: {
    async updateSumbission(parent, { data }, context: Context) {
      var frames = []
      const id = data.id
      const sub = await context.prisma.submission({ id }).timeframes()
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
        fragment Submission on Submission {
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
      const payPerMonth = await context.prisma.submission({ id }).payPerMonth()
      const payTotal = payPerMonth * data.number_of_months

      if (data.timeframes == null) {
        return await context.prisma.updateSubmission({
          where: { id },
          data: { number_of_months: data.number_of_months, payTotal: payTotal },
        }).$fragment(`
        fragment Submission on Submission {
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
      fragment Submission on Submission {
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
      const p = await context.prisma.persons({ where: { kennitala: kennitala } })
      const person = p[0]
      if (person == null) {
        return null
      }

      const id = person.id
      var frames = []
      let income = person.income * 0.8
      if (income < 184119) {
        income = 184199
      }

      if (income > 600000) {
        income = 600000
      }
      const payPerMonth = income - income * (person.income_tax_rate / 100) - income * (person.pension / 100) - income * (person.additional_pension / 100) - income * (person.union_fees / 100) + 54628 * (person.personal_discount / 100)
      const payTotal = payPerMonth * number_of_months


      for (let item of timeFrames) {
        frames.push({ start: item['start'], end: item['end'] })
      }
      return await context.prisma.createSubmission({ person: { connect: { id: id } }, number_of_months, payPerMonth, payTotal, timeframes: { create: frames } }).$fragment(`
      fragment Submission on Submission {
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
