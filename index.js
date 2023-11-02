import { ApolloServer, UserInputError, gql } from 'apollo-server'
import { v1 as uuid } from 'uuid'


const typeDefinition = gql`
enum YesNo{
    YES
    NO
}
type Address{
    street: String!
    city: String!
}
type Person{ 
    age: Int!
    name: String!
    phone: String
    street: String!
    address: Address!
    id: ID! 
}

type Query{
    personCount: Int!
    allPersons(phone: YesNo): [Person!]!
    findPerson(name: String!): Person
}
type Mutation{
    addPerson(
        name: String!
        phone: String
        street: String!
        city: String!
    ): Person
    editNumber(
        name: String!
        phone: String!
        ): Person
}
`

const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: async (root, args) => {
            const { data: personFromRestApi } = await axios.get('http://localhost:3001/persons')
            if (!args.phone) return personFromRestApi
            const byPhone = (person) => {
                return args.phone === "YES" ? person.phone !== null : person.phone === null
            }
            return personFromRestApi.filter(byPhone)
        },
        findPerson: (root, args) => {
            const name = args.name
            return persons.find(person => person.name === name)
        }
    },
    Person: {
        address: (root) => {
            return {
                street: root.street,
                city: root.city
            }
        }
    },
    Mutation: {
        addPerson: (root, args) => {
            if (persons.find(p => p.name === args.name)) {
                throw new UserInputError('Name must be unique', { invalidArgs: args.name })
            }
            const person = { ...args, id: uuid() }
            persons.push(person) //update database with new person
            return person
        },

        editNumber: (root, args) => {
            const personIndex = persons.findIndex(p => p.name === args.name)
            if (personIndex === -1) return null

            const person = persons[personIndex]

            const updatedPerson = { ...person, phone: args.phone }
            persons[personIndex] = updatedPerson
            return updatedPerson
        }
    }

}

const server = new ApolloServer({
    typeDefs: typeDefinition,
    resolvers
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
}) 