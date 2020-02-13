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
    person(parent, { kennitala }, context: Context) {
      return context.prisma.persons({ where: { kennitala: kennitala} })
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
    // createSubmission(parent, {info}, context:Context) {
    //   console.log(info);
    //   // return context.prisma.createSubmiss({info:info})
    // },
    createPerson(parent, args, context:Context) {
      return context.prisma.createPerson(args)
    }
  },
}

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: { prisma },
})
server.start(() => console.log('Server is running on http://localhost:4000'))
