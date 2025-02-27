from random import choices, randint, random
from typing import List, Callable, Tuple
from collections import namedtuple
from functools import partial

# Define Named Tuples
Group = namedtuple('Group', ['id', 'domain_prefs', 'teacher_prefs'])
Teacher = namedtuple('Teacher', ['id', 'name', 'domain_prefs', 'max_groups'])

# Define Domains
domains = ["Cybersecurity", "AI-ML", "Cloud Computing", "Big Data", "Networking", "Blockchain", "DevOps", "IoT"]

# Define Groups
groups = [
    Group(id=1, domain_prefs=[1, 0, 2, 0, 3, 0, 0, 0], teacher_prefs={0: [1, 2, 0, 0, 0], 2: [0, 0, 0, 0, 0], 4: [0, 3, 2, 0, 1]}),
    Group(id=2, domain_prefs=[1, 2, 3, 0, 0, 0, 0, 0], teacher_prefs={0: [2, 1, 0, 0, 0], 1: [0, 0, 1, 2, 0], 2: [2, 0, 0, 0, 1]}),
    Group(id=3, domain_prefs=[0, 2, 0, 1, 0, 0, 0, 3], teacher_prefs={1: [0, 0, 2, 1, 0], 3: [0, 2, 1, 0, 0], 7: [0, 0, 0, 1, 0]}),
]

# Define Teachers
teachers = [
    Teacher(id=0, name='Prof. Snehal Patil', domain_prefs=[1, 0, 2, 0, 0, 3, 0, 0], max_groups=2),
    Teacher(id=1, name='Prof. Vinay Bhave', domain_prefs=[1, 0, 0, 2, 3, 0, 0, 0], max_groups=2),
    Teacher(id=2, name='Prof. Shankar Jadhav', domain_prefs=[0, 2, 0, 2, 1, 0, 4, 0], max_groups=2),
    Teacher(id=3, name='Prof. Neha Kotak', domain_prefs=[0, 1, 0, 0, 0, 3, 0, 2], max_groups=2),
    Teacher(id=4, name='Prof. Kiran Rao', domain_prefs=[0, 0, 1, 0, 2, 0, 3, 0], max_groups=2),
]

# Type Aliases
Genome = List[Tuple[int, int]]
Population = List[Genome]
FitnessFunc = Callable[[Genome], int]
PopulateFunc = Callable[[], Population]
SelectionFunc = Callable[[Population, FitnessFunc], Tuple[Genome, Genome]]
CrossoverFunc = Callable[[Genome, Genome], Tuple[Genome, Genome]]
MutationFunc = Callable[[Genome], Genome]

# Generate Population
def generate_genome() -> Genome:
    return [(randint(0, 3), randint(0, 1)) for _ in range(len(groups))]

def generate_population(size: int) -> Population:
    return [generate_genome() for _ in range(size)]

# Fitness Function
def fitness(genome: Genome) -> int:
    total_fitness = 0
    teacher_assignment_count = {teacher.id: 0 for teacher in teachers}

    for group_idx, (assigned_domain, assigned_teacher) in enumerate(genome):
        group = groups[group_idx]

        domain_pref_value = group.domain_prefs[assigned_domain]
        total_fitness += 10 if domain_pref_value == 0 else domain_pref_value

        teacher_pref = group.teacher_prefs.get(assigned_domain, [])
        total_fitness += teacher_pref.index(assigned_teacher) if assigned_teacher in teacher_pref else len(teacher_pref)

        teacher = teachers[assigned_teacher]
        teacher_domain_pref_value = teacher.domain_prefs[assigned_domain]
        total_fitness += 10 if teacher_domain_pref_value == 0 else teacher_domain_pref_value

        teacher_assignment_count[assigned_teacher] += 1
        if teacher_assignment_count[assigned_teacher] > teacher.max_groups:
            total_fitness += 10

    return total_fitness

# Selection, Crossover, and Mutation
def selection_pair(population: Population, fitness_func: FitnessFunc) -> Population:
    return choices(population=population, weights=[fitness_func(genome) for genome in population], k=2)

def single_point_crossover(a: Genome, b: Genome) -> Tuple[Genome, Genome]:
    length = len(a)
    if length < 2:
        return a, b
    p = randint(1, length - 1)
    return a[0:p] + b[p:], b[0:p] + a[p:]

def mutation(genome: Genome, num: int = 1, probability: float = 0.5) -> Genome:
    for _ in range(num):
        index = randint(0, len(genome) - 1)
        if random() < probability:
            genome[index] = (randint(0, len(groups[index].domain_prefs) - 1), randint(0, len(teachers) - 1))
    return genome

# Run Evolution
def run_evolution(
    populate_func: PopulateFunc,
    fitness_func: FitnessFunc,
    fitness_limit: int,
    selection_func: SelectionFunc = selection_pair,
    crossover_func: CrossoverFunc = single_point_crossover,
    mutation_func: MutationFunc = mutation,
    generation_limit: int = 100
) -> Tuple[Population, int]:
    population = populate_func()
    for i in range(generation_limit):
        population = sorted(population, key=lambda genome: fitness_func(genome))

        if fitness_func(population[0]) <= fitness_limit:
            break

        next_generation = population[:2]
        for _ in range(len(population) // 2 - 1):
            parents = selection_func(population, fitness_func)
            offspring_a, offspring_b = crossover_func(parents[0], parents[1])
            next_generation.extend([mutation_func(offspring_a), mutation_func(offspring_b)])

        population = next_generation
    return population, i
