from random import choices, randint, random
from typing import List, Callable, Tuple
from collections import namedtuple
from functools import partial

Projects = namedtuple('Group', ['id', 'teacher_prefs'])
Guide = namedtuple('Teacher', ['username', 'max_groups'])

Genome = List[Tuple[int, int]]
Population = List[Genome]
FitnessFunc = Callable[[Genome], int]
PopulateFunc = Callable[[], Population]
SelectionFunc = Callable[[Population, FitnessFunc], Tuple[Genome, Genome]]
CrossoverFunc = Callable[[Genome, Genome], Tuple[Genome, Genome]]
MutationFunc = Callable[[Genome], Genome]

def generate_genome(groups, teachers) -> Genome:
    return [randint(0, len(teachers) - 1) for _ in range(len(groups))]

def population(size: int, groups, teachers) -> Population:
    return [generate_genome(groups, teachers) for _ in range(size)]

def fitness_func(genome: Genome, groups, teachers) -> int:
    total_fitness = 0
    teacher_assignment_count = {teacher.username: 0 for teacher in teachers}

    for group_idx, assigned_teacher in enumerate(genome):
        group = groups[group_idx]

        pref_value = group.teacher_prefs[assigned_teacher]

        if pref_value == 0:
            total_fitness += 10
        else:
            total_fitness += pref_value
        
        teacher_username = teachers[assigned_teacher].username
        teacher_assignment_count[teacher_username] += 1

        if teacher_assignment_count[teacher_username] > teachers[assigned_teacher].max_groups:
            total_fitness += 20

    return total_fitness

def selection_pair(population: Population, fitness_func: FitnessFunc) -> Population:
    return choices(population=population, weights=[fitness_func(genome) for genome in population], k=2)

def single_point_crossover(a: Genome, b: Genome) -> Tuple[Genome, Genome]:
    length = len(a)
    if length < 2:
        return a, b
    p = randint(1, length - 1)
    return a[0:p] + b[p:], b[0:p] + a[p:]

def mutation(genome: Genome, num: int = 1, probability: float = 0.5, teachers_len: int = 0) -> Genome:
    for _ in range(num):
        index = randint(0, len(genome) - 1)
        if random() < probability:
            genome[index] = randint(0, teachers_len - 1)
    return genome

# Run Evolution
def evolution(
    populate_func: PopulateFunc,
    fitness_func: FitnessFunc,
    groups,  
    teachers,
    selection_func: SelectionFunc = selection_pair,
    crossover_func: CrossoverFunc = single_point_crossover,
    mutation_func: MutationFunc = mutation,
    generation_limit: int = 100,
    patience: int = 10,
) -> Tuple[Population, int]:
    population = populate_func()
    best_fitness = float('inf')
    no_improvement_count = 0

    for i in range(generation_limit):
        population = sorted(population, key=lambda genome: fitness_func(genome))
        current_best_fitness = fitness_func(population[0])

        if current_best_fitness < best_fitness:
            best_fitness = current_best_fitness
            no_improvement_count = 0  
        else:
            no_improvement_count += 1

        if no_improvement_count >= patience:
            print(f"No improvement for {patience} generations. Stopping early.")
            break

        next_generation = population[:2]  
        for _ in range(len(population) // 2 - 1):
            parents = selection_func(population, fitness_func)
            offspring_a, offspring_b = crossover_func(parents[0], parents[1])
            next_generation.extend([
                mutation_func(offspring_a, teachers_len=len(teachers)),
                mutation_func(offspring_b, teachers_len=len(teachers))
            ])

        population = next_generation  

    return population, i