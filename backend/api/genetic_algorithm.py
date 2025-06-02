from random import choices, randint, random, sample, seed, uniform, choice
from typing import List, Callable, Tuple
from collections import namedtuple
from functools import partial
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
# Define Named Tuples
Group = namedtuple('Group', ['id', 'domain_prefs', 'teacher_prefs'])
Teachers = namedtuple('Teacher', ['username', 'domain_prefs', 'max_groups'])

# Type Aliases
Genome = List[Tuple[int, int]]
Population = List[Genome]
FitnessFunc = Callable[[Genome], int]
PopulateFunc = Callable[[], Population]
SelectionFunc = Callable[[Population, FitnessFunc], Tuple[Genome, Genome]]
CrossoverFunc = Callable[[Genome, Genome], Tuple[Genome, Genome]]
MutationFunc = Callable[[Genome], Genome]

# Generate Population
def generate_genome(groups, teachers) -> Genome:
    return [(randint(0, len(groups[i].domain_prefs) - 1), randint(0, len(teachers) - 1)) for i in range(len(groups))]

def generate_population(size: int, groups, teachers) -> Population:
    return [generate_genome(groups, teachers) for _ in range(size)]

# Fitness Function
def fitness(genome: Genome, groups, teachers) -> int:
    total_fitness = 0
    teacher_assignment_count = {teacher.username: 0 for teacher in teachers}

    for group_idx, (assigned_domain, assigned_teacher) in enumerate(genome):
        group = groups[group_idx]

        domain_pref_value = group.domain_prefs[assigned_domain]
        if domain_pref_value == 0:
            total_fitness += 50
        else:
            total_fitness += domain_pref_value

        teacher_pref = group.teacher_prefs.get(assigned_domain, [])
        if assigned_teacher in teacher_pref:
            total_fitness += teacher_pref.index(assigned_teacher)
        else:
            total_fitness += 30

        teacher = teachers[assigned_teacher]
        teacher_domain_pref_value = teacher.domain_prefs[assigned_domain]
        if teacher_domain_pref_value == 0:
            total_fitness += 50
        else:
            total_fitness += teacher_domain_pref_value

        teacher_username = teachers[assigned_teacher].username  # Get the actual username
        teacher_assignment_count[teacher_username] += 1
        if teacher_assignment_count[teacher_username] > teacher.max_groups:
            total_fitness += 40

    return total_fitness

# Selection, Crossover, and Mutation
def selection_pair(population: Population, fitness_func: FitnessFunc) -> Population:
    return choices(population=population, weights=[fitness_func(genome) for genome in population], k=2)
def rank_based_selection(population: Population, fitness_func: FitnessFunc) -> Tuple[Genome, Genome]:
    # Sort population by fitness (ascending order: lower fitness means better)
    sorted_population = sorted(population, key=lambda genome: fitness_func(genome))
    
    # Assign ranks based on sorted population (1 is the best rank)
    ranks = list(range(1, len(sorted_population) + 1))
    
    # Convert ranks to selection probabilities
    total_rank = sum(ranks)
    selection_probabilities = [rank / total_rank for rank in ranks]
    
    # Select two genomes based on rank probabilities
    selected_genomes = choices(sorted_population, weights=selection_probabilities, k=2)
    
    return selected_genomes[0], selected_genomes[1]
def tournament_selection(population: Population, fitness_func: FitnessFunc, k=3) -> Tuple[Genome, Genome]:
    tournament = [choices(population)[0] for _ in range(k)]
    tournament = sorted(tournament, key=fitness_func)
    return tournament[0], tournament[1]
# def single_point_crossover(a: Genome, b: Genome) -> Tuple[Genome, Genome]:
#     length = len(a)
#     if length < 2:
#         return a, b
#     p = randint(1, length - 1)
#     return a[0:p] + b[p:], b[0:p] + a[p:]
def uniform_crossover(groups, teachers, a: Genome, b: Genome, generation: int = 0, generation_limit: int = 100) -> Tuple[Genome, Genome]:
    return [(a[i] if random() < 0.5 else b[i]) for i in range(len(a))], \
           [(b[i] if random() < 0.5 else a[i]) for i in range(len(b))]
def adaptive_crossover_rate(generation: int, generation_limit: int, initial_rate: float = 0.7) -> float:
    return initial_rate * (1 - generation / generation_limit)

def two_point_crossover(a: Genome, b: Genome) -> Tuple[Genome, Genome]:
    point1 = randint(1, len(a) - 1)
    point2 = randint(point1, len(a))
    return a[:point1] + b[point1:point2] + a[point2:], b[:point1] + a[point1:point2] + b[point2:]

def crossover(groups, teachers, a: Genome, b: Genome, generation: int = 0, generation_limit: int = 100) -> Tuple[Genome, Genome]:
    crossover_probability = adaptive_crossover_rate(generation, generation_limit)
    if random() < crossover_probability:
        return uniform_crossover(groups, teachers, a, b)
    else:
        return a, b 
    
def swap_mutation(genome):
    i, j = sample(range(len(genome)), 2)
    genome[i], genome[j] = genome[j], genome[i]
    return genome

def random_reassign_mutation(genome, valid_values):
    i = randint(0, len(genome) - 1)
    genome[i] = choice(valid_values)  # Replace with a random valid domain/teacher
    return genome

def shift_mutation(genome):
    i, j = sorted(sample(range(len(genome)), 2))
    genome.insert(j, genome.pop(i))
    return genome

def combined_mutation(groups, teachers, genome, generation, generation_limit,valid_values):
    mutations = [
        swap_mutation, 
        lambda g: random_reassign_mutation(g, valid_values),  # Pass valid_values
        shift_mutation
    ]
    
    # Decide how many mutations to apply (e.g., 2 out of 3)
    num_mutations = randint(1, len(mutations))

    # Apply mutations randomly
    for mutation in sample(mutations, num_mutations):
        genome = mutation(genome)  # Apply mutation
    
    return genome

# def mutation(groups, teachers, genome: Genome, num: int = 1, probability: float = 0.9) -> Genome:
#     for _ in range(num):
#         index = randint(0, len(genome) - 1)
#         if random() < probability:
#             genome[index] = (randint(0, len(groups[index].domain_prefs) - 1), randint(0, len(teachers) - 1))
#     return genome
def adaptive_mutation_rate(generation: int, generation_limit: int, initial_rate: float = 0.5) -> float:
    return initial_rate * (1 - generation / generation_limit)
def mutation(groups, teachers, genome: Genome, num: int = 1, generation: int = 0, generation_limit: int = 100) -> Genome:
    mutation_probability = adaptive_mutation_rate(generation, generation_limit)
    for _ in range(num):
        index = randint(0, len(genome) - 1)
        if random() < mutation_probability:
            genome[index] = (randint(0, len(groups[index].domain_prefs) - 1), randint(0, len(teachers) - 1))
    return genome

import math
from collections import deque
def simulated_annealing(initial_solution, fitness_func, neighbor_func, 
                        max_iterations=50, initial_temp=50, cooling_rate=0.99, tabu_size=50):
    current_solution = initial_solution
    current_fitness = fitness_func(current_solution)
    best_solution = current_solution
    best_fitness = current_fitness
    temperature = initial_temp
    
    tabu_list = deque(maxlen=tabu_size)  # FIFO queue for Tabu List

    for iteration in range(max_iterations):
        # Generate a neighboring solution
        neighbor = neighbor_func(current_solution)
        neighbor_fitness = fitness_func(neighbor)

        # Check if the neighbor is in the Tabu List
        if neighbor in tabu_list:
            continue  # Skip this neighbor if it's in the tabu list

        # Accept better solutions
        if neighbor_fitness < current_fitness:
            current_solution = neighbor
            current_fitness = neighbor_fitness
        else:
            # Accept worse solutions with probability (Simulated Annealing)
            prob = math.exp((current_fitness - neighbor_fitness) / temperature)
            if random() < prob:
                current_solution = neighbor
                current_fitness = neighbor_fitness
        
        # Update best solution
        if current_fitness < best_fitness:
            best_solution = current_solution
            best_fitness = current_fitness
        
        # Add solution to Tabu List
        tabu_list.append(neighbor)
        
        # Reduce temperature
        temperature *= cooling_rate

    return best_solution, best_fitness
# def simulated_annealing(solution, fitness_func, neighbor_func, max_iterations=50):  # Reduce iterations
#     temperature = 100
#     cooling_rate = 0.95
#     best_solution = solution
#     best_fitness = fitness_func(solution)
    
#     for _ in range(max_iterations):  # Reduce iterations
#         new_solution = neighbor_func(best_solution)
#         new_fitness = fitness_func(new_solution)
        
#         if new_fitness < best_fitness:
#             best_solution = new_solution
#             best_fitness = new_fitness
        
#         temperature *= cooling_rate
#         if temperature < 0.1:  # Stop early if temperature is too low
#             break
    
#     return best_solution, best_fitness
# def simulated_annealing(solution, fitness_func, neighbor_func, initial_temp=1000, cooling_rate=0.95, min_temp=1):
#     current_solution = solution
#     current_fitness = fitness_func(current_solution)
#     temp = initial_temp

#     while temp > min_temp:
#         new_solution = neighbor_func(current_solution)
#         new_fitness = fitness_func(new_solution)

#         # Acceptance probability
#         delta = new_fitness - current_fitness  # Since GA minimizes, use (current - new)
#         if delta < 0 or uniform(0, 1) < math.exp(-delta / temp):
#             current_solution, current_fitness = new_solution, new_fitness

#         # Cool down
#         temp *= cooling_rate

#     return current_solution, current_fitness
def neighbor(solution):
    new_solution = solution[:]
    idx1, idx2 = sample(range(len(solution)), 2)
    new_solution[idx1], new_solution[idx2] = new_solution[idx2], new_solution[idx1]
    return new_solution
def run_evolution(
    populate_func: PopulateFunc,
    fitness_func: FitnessFunc,
    groups,  
    teachers,
    valid_values,
    selection_func: SelectionFunc = tournament_selection,
    crossover_func: CrossoverFunc = crossover,
    mutation_func: MutationFunc = combined_mutation,
    generation_limit: int = 100,
    patience: int = 20,
) -> Tuple[Population, int]:
    population = populate_func()
    best_fitness = float('inf')
    no_improvement_count = 0

    for generation in range(generation_limit):
        # Sort population based on fitness
        population = sorted(population, key=lambda genome: fitness_func(genome))
        elite_size = max(2, len(population) // 20)  # Keep top 10% of best individuals
        next_generation = population[:elite_size] 
        current_best_fitness = fitness_func(population[0])

        # Early stopping if no improvement for 'patience' generations
        if current_best_fitness < best_fitness:
            best_fitness = current_best_fitness
            no_improvement_count = 0
        else:
            no_improvement_count += 1

        if no_improvement_count >= patience:
            print(f"No improvement for {patience} generations. Stopping early.")
            break

        top_individuals = sorted(population, key=lambda x: fitness_func(x))[:int(len(population) * 0.1)]

        # Apply Parallel Simulated Annealing (with Tabu Search)
        # with concurrent.futures.ThreadPoolExecutor() as executor:
        #     results = list(executor.map(lambda ind: simulated_annealing(ind, fitness_func, neighbor), top_individuals))

        # # Update individuals with SA results
        # top_individuals = [res[0] for res in results]   
        # # Apply Simulated Annealing to these individuals
        # if generation % 5 == 0:
        #     for i in range(len(top_individuals)):
        #         improved_solution, improved_fitness = simulated_annealing(
        #             top_individuals[i], fitness_func, neighbor
        #         )
        #         top_individuals[i] = improved_solution  

        batch_size = max(2, len(top_individuals) // 6)  # Run 25% at a time
        optimized_individuals = []

        with ThreadPoolExecutor() as executor:
            for i in range(0, len(top_individuals), batch_size):
                batch = top_individuals[i:i + batch_size]
                results = list(executor.map(lambda ind: simulated_annealing(ind, fitness_func, neighbor), batch))
                optimized_individuals.extend([res[0] for res in results])

        next_generation.extend(optimized_individuals)

        # Selection and reproduction (ensuring enough offspring)
        while len(next_generation) < len(population):  # Ensure all groups are covered
            parents = selection_func(population, fitness_func)
            offspring_a, offspring_b = crossover_func(groups,teachers,parents[0], parents[1])
            # next_generation.extend([
            #     mutation_func(groups, teachers, offspring_a, generation=generation, generation_limit=generation_limit),
            #     mutation_func(groups, teachers, offspring_b, generation=generation, generation_limit=generation_limit)
            # ])

            if random() < 0.5:  # Apply SA to 50% of offspring
                offspring_a, _ = simulated_annealing(offspring_a, fitness_func, neighbor)
            if random() < 0.5:
                offspring_b, _ = simulated_annealing(offspring_b, fitness_func, neighbor)
            
            with ThreadPoolExecutor() as executor:
                mutated_offspring = list(executor.map(
                    lambda genome: mutation_func(groups, teachers, genome, generation, generation_limit,valid_values), 
                    [offspring_a, offspring_b]
                ))

            offspring_a, offspring_b = mutated_offspring
            # offspring_a = mutation_func(groups, teachers, offspring_a)
            # offspring_b = mutation_func(groups, teachers, offspring_b)
        
            next_generation.extend([offspring_a, offspring_b])
        population = next_generation  # Update population for next generation
    best_ga_solution = min(population, key=fitness_func)
    best_solution, best_fitness = simulated_annealing(best_ga_solution, fitness_func, neighbor)
    return best_solution