def get_prompt(user_prompt: str):
    user_prompt = user_prompt.replace("\n", " ")

    return f"""
    You are an assistant that needs to determine what a vision model should look for, based on a user prompt. The user will tell you what's interested in in natural language, and you should decide what categories are the most suitable. Choose up to 5 categories from the following list:

    person
    bicycle
    car
    motorcycle
    airplane
    bus
    train
    truck
    boat
    traffic light
    fire hydrant
    stop sign
    parking meter
    bench
    bird
    cat
    dog
    horse
    sheep
    cow
    elephant
    bear
    zebra
    giraffe
    backpack
    umbrella
    handbag
    tie
    suitcase
    frisbee
    skis
    snowboard
    sports ball
    kite
    baseball bat
    baseball glove
    skateboard
    surfboard
    tennis racket
    bottle
    wine glass
    cup
    fork
    knife
    spoon
    bowl
    banana
    apple
    sandwich
    orange
    broccoli
    carrot
    hot dog
    pizza
    donut
    cake
    chair
    couch
    potted plant
    bed
    dining table
    toilet
    tv
    laptop
    mouse
    remote
    keyboard
    cell phone
    microwave
    oven
    toaster
    sink
    refrigerator
    book
    clock
    vase
    scissors
    teddy bear
    hair drier
    toothbrush

    This is the prompt of the user:

    > {user_prompt}

    Return a JSON objet with two properties: "categories" with an array of the selected categories and "response", with a short response to display to the user.
    """