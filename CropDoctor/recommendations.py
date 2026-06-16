# Crop disease database and recommendation system

DISEASE_DATA = {
    "Apple_Apple_Scab": {
        "disease": "Apple Scab",
        "crop": "Apple",
        "description": "A serious fungal disease that affects apple leaves, buds, blossoms, and fruit, leading to reduced fruit quality and premature leaf drop.",
        "symptoms": "Olive-green to brown, velvety spots on leaves that turn black; fruit develops dark, corky, cracked lesions.",
        "causes": "Fungus (Venturia inaequalis) which overwinters on fallen leaves and spreads via wind and rain in damp spring weather.",
        "treatments": [
            "Apply chemical fungicides (e.g., Captan, Myclobutanil) during early green tip stage.",
            "Spray organic liquid copper or sulfur fungicides.",
            "Rake and destroy fallen leaves and fruit in autumn to reduce spores."
        ],
        "prevention": [
            "Plant resistant cultivars (e.g., Honeycrisp, Liberty).",
            "Prune trees annually to improve airflow and dry the canopy quickly.",
            "Avoid overhead irrigation to keep leaves dry."
        ]
    },
    "Apple_Black_Rot": {
        "disease": "Black Rot",
        "crop": "Apple",
        "description": "A fungal infection causing cankers on limbs, leaf spots (frog-eye), and rotting of fruit near the blossom end.",
        "symptoms": "Reddish-purple spots on leaves that enlarge to have a dark border (frog-eye); fruit develops firm, leathery, dark brown/black rotten areas with concentric rings.",
        "causes": "Fungus (Botryosphaeria obtusa) entering through wounds, dead wood, or mummified fruit left on the tree.",
        "treatments": [
            "Prune out dead or infected branches and remove mummified fruit from the tree.",
            "Apply protective fungicides (Captan, Thiophanate-methyl) from pink bud stage through harvest."
        ],
        "prevention": [
            "Remove all prunings and mummified fruit from the orchard.",
            "Keep trees healthy and avoid mechanical injuries to bark.",
            "Plant in full sun with good air circulation."
        ]
    },
    "Apple_Cedar_Apple_Rust": {
        "disease": "Cedar Apple Rust",
        "crop": "Apple",
        "description": "A dual-host fungal disease requiring both apple trees and eastern red cedars to complete its life cycle.",
        "symptoms": "Bright yellow-orange spots on the upper surface of leaves, followed by tiny black dots. Later, orange tube-like structures form on the leaf undersides.",
        "causes": "Fungus (Gymnosporangium juniperi-virginianae) spreading spores between red cedars/junipers and apple trees during wet spring weather.",
        "treatments": [
            "Apply systemic fungicides (e.g., Myclobutanil) at weekly intervals from bud break through petal fall.",
            "Remove nearby cedar galls/trees if practical."
        ],
        "prevention": [
            "Plant rust-resistant apple varieties (e.g., Red Delicious, Empire).",
            "Avoid planting apple trees near eastern red cedars or junipers (within a few hundred yards)."
        ]
    },
    "Banana_Sigatoka": {
        "disease": "Sigatoka Leaf Spot",
        "crop": "Banana",
        "description": "A destructive fungal disease that significantly reduces photosynthetic leaf area, leading to lower fruit yields.",
        "symptoms": "Small, dark brown or black spots or streaks on leaves, running parallel to veins, which expand into large necrotic areas.",
        "causes": "Fungus (Mycosphaerella musicola or fijiensis) favored by high humidity, warm temperatures, and leaf wetness.",
        "treatments": [
            "Apply fungicides like Mancozeb, copper fungicides, or systemic triazoles.",
            "De-leaf and destroy infected older leaves regularly to lower spore load."
        ],
        "prevention": [
            "Maintain wide spacing between plants to reduce humidity and increase airflow.",
            "Ensure excellent soil drainage and balanced nutrition.",
            "Grow resistant banana cultivars."
        ]
    },
    "Bean_Rust": {
        "disease": "Bean Rust",
        "crop": "Bean",
        "description": "A fungal disease affecting leaves, pods, and stems of beans, majorly impacting yield in warm, humid areas.",
        "symptoms": "Small, reddish-brown powdery pustules (spots) on the undersides of leaves, surrounded by yellow halos.",
        "causes": "Fungus (Uromyces appendiculatus) favored by high humidity, moderate temperatures, and prolonged leaf wetness.",
        "treatments": [
            "Apply sulfur-based or copper fungicides at the first sign of disease.",
            "Remove and destroy heavily infected plants after harvest."
        ],
        "prevention": [
            "Avoid overhead watering; irrigate at the base of the plant.",
            "Space plants adequately to encourage fast drying of foliage.",
            "Rotate crops annually with non-host plants."
        ]
    },
    "Corn_Common_Rust": {
        "disease": "Common Rust",
        "crop": "Corn",
        "description": "A fungal disease that infects corn leaves, causing reduced photosynthesis and potential yield loss.",
        "symptoms": "Elongated, reddish-brown pustules on both upper and lower leaf surfaces, which powdery spores rub off easily.",
        "causes": "Fungus (Puccinia sorghi) transported by wind from southern overwintering regions.",
        "treatments": [
            "Fungicides (e.g., strobilurins, triazoles) are rarely needed for field corn but may be used on high-value sweet corn if infection is severe.",
            "Incorporate crop residues after harvest to help decay pathogens."
        ],
        "prevention": [
            "Plant resistant hybrids (the most effective management strategy).",
            "Plant early to avoid peak spore loads in mid-to-late summer."
        ]
    },
    "Corn_Northern_Leaf_Blight": {
        "disease": "Northern Leaf Blight",
        "crop": "Corn",
        "description": "A destructive fungal disease of corn leaves that can cause significant yield loss, especially if established before silking.",
        "symptoms": "Long, elliptical, grayish-green or tan lesions on leaves, resembling 'cigar' shapes, up to 6 inches long.",
        "causes": "Fungus (Exserohilum turcicum) overwintering in corn debris and spreading via wind/splashing water.",
        "treatments": [
            "Apply foliar fungicides at first sign of disease, especially around tasseling/silking.",
            "Till under infected crop residue to accelerate decomposition."
        ],
        "prevention": [
            "Select hybrids with genetic resistance to Northern Corn Leaf Blight.",
            "Practice a 1-to-2-year crop rotation away from corn."
        ]
    },
    "Potato_Early_Blight": {
        "disease": "Early Blight",
        "crop": "Potato",
        "description": "A very common fungal disease affecting foliage, stems, and tubers, reducing yield and storage life.",
        "symptoms": "Dark brown or black spots with concentric rings (target-like pattern) on older leaves first, surrounded by yellow tissue.",
        "causes": "Fungus (Alternaria solani) thriving in warm, humid weather with alternating wet and dry periods.",
        "treatments": [
            "Apply protectant fungicides (Chlorothalonil, Mancozeb) or systemic fungicides when disease first appears.",
            "Apply copper-based organic sprays."
        ],
        "prevention": [
            "Use certified disease-free seed tubers.",
            "Rotate crops with non-solanaceous plants for 2-3 years.",
            "Provide balanced nitrogen nutrition to keep plants vigorous."
        ]
    },
    "Potato_Late_Blight": {
        "disease": "Late Blight",
        "crop": "Potato",
        "description": "A highly destructive disease capable of destroying an entire crop in a few days; historically responsible for the Irish Potato Famine.",
        "symptoms": "Dark water-soaked lesions on leaves/stems, often with a white fuzzy mold on the underside of leaves during humid weather. Tubers rot and turn purple-brown.",
        "causes": "Oomycete pathogen (Phytophthora infestans) spreading rapidly in cool, wet, and humid conditions.",
        "treatments": [
            "Apply targeted fungicides (e.g., metalaxyl, chlorothalonil) immediately upon detection or weather warning.",
            "Destroy all infected plant material; do not compost."
        ],
        "prevention": [
            "Plant resistant cultivars.",
            "Use only certified, disease-free seed tubers.",
            "Avoid overhead watering and destroy volunteer potato plants in spring."
        ]
    },
    "Tomato_Early_Blight": {
        "disease": "Early Blight",
        "crop": "Tomato",
        "description": "A common fungal disease causing leaf spots, stem cankers, and fruit rot in tomatoes.",
        "symptoms": "Concentric rings (target pattern) on older leaves first, yellowing of surrounding tissue, eventual defoliation starting from the bottom.",
        "causes": "Fungus (Alternaria solani) overwintering in soil and crop debris, splashing onto lower leaves.",
        "treatments": [
            "Prune off lower leaves near the ground to improve airflow.",
            "Apply copper fungicides or synthetic fungicides (like Chlorothalonil)."
        ],
        "prevention": [
            "Mulch the soil surface to prevent soil splash onto lower leaves.",
            "Rotate crops so tomatoes aren't grown in the same spot for 3 years.",
            "Water at the base of the plant using drip irrigation."
        ]
    },
    "Tomato_Late_Blight": {
        "disease": "Late Blight",
        "crop": "Tomato",
        "description": "A devastating disease affecting tomatoes and potatoes, spreading rapidly in cool, wet weather.",
        "symptoms": "Large, irregular water-soaked spots on leaves and stems, turning brown/black. White fuzzy mold on leaf undersides in humid conditions. Large brown, leathery patches on fruit.",
        "causes": "Water mold (Phytophthora infestans) that thrives and spreads rapidly via wind and water under cool, damp conditions.",
        "treatments": [
            "Apply copper-based fungicides immediately.",
            "Pull up and destroy severely infected plants to prevent spread to neighboring gardens."
        ],
        "prevention": [
            "Buy disease-resistant varieties (e.g., Defiant, Mountain Merit).",
            "Keep foliage dry by watering early in the morning and using drip lines.",
            "Ensure good spacing between plants."
        ]
    },
    "Tomato_Yellow_Leaf_Curl": {
        "disease": "Yellow Leaf Curl Virus",
        "crop": "Tomato",
        "description": "A highly destructive viral disease that causes severe stunting and yield loss in tomato crops.",
        "symptoms": "Upward curling and crumpling of leaves, severe yellowing (chlorosis) at margins, stunted plant growth, and failure of flowers/fruit to develop.",
        "causes": "Tomato Yellow Leaf Curl Virus (TYLCV), transmitted solely by silverleaf whiteflies (Bemisia tabaci).",
        "treatments": [
            "Control whitefly populations using insecticidal soaps, neem oil, or chemical insecticides (e.g., imidacloprid).",
            "Remove and destroy infected plants immediately to prevent they act as a virus source."
        ],
        "prevention": [
            "Use physical barriers like insect-proof netting in greenhouses.",
            "Plant resistant tomato varieties.",
            "Weed control around the field to remove alternative hosts for whiteflies."
        ]
    },
    "Wheat_Brown_Rust": {
        "disease": "Brown Rust / Leaf Rust",
        "crop": "Wheat",
        "description": "A major fungal disease of wheat affecting leaves, reducing grain weight, quality, and overall yield.",
        "symptoms": "Small, orange-brown, oval pustules scattered randomly on the upper leaf surface. Pustules turn black as the plant matures.",
        "causes": "Fungus (Puccinia triticina) requiring living host tissue, spreading via airborne spores in warm, moist climates.",
        "treatments": [
            "Apply triazole or strobilurin-based foliar fungicides at the onset of infection.",
            "Ensure proper nitrogen fertilization (excessive N can worsen rust)."
        ],
        "prevention": [
            "Grow resistant wheat cultivars (most economical control).",
            "Sow early to avoid the peak infection period of the fungus.",
            "Eliminate volunteer wheat plants which act as a green bridge."
        ]
    },
    "Wheat_Yellow_Rust": {
        "disease": "Yellow Rust / Stripe Rust",
        "crop": "Wheat",
        "description": "A destructive fungal disease of wheat that thrives in cooler climates, forming distinct stripes on leaves.",
        "symptoms": "Yellow to orange-yellow pustules arranged in narrow, parallel stripes along the leaf veins.",
        "causes": "Fungus (Puccinia striiformis) favored by cool, wet weather (10-15°C) and dew/rainfall.",
        "treatments": [
            "Apply systemic fungicides (e.g., tebuconazole, propiconazole) immediately when disease is first observed in the field.",
            "Monitor fields regularly in early spring."
        ],
        "prevention": [
            "Sow certified rust-resistant wheat varieties.",
            "Avoid excessive nitrogen application.",
            "Rotate crops to break disease cycles."
        ]
    },
    "Wheat_Septoria": {
        "disease": "Septoria Tritici Blight",
        "crop": "Wheat",
        "description": "A prevalent foliar disease causing significant yield loss, particularly in high-rainfall wheat-growing areas.",
        "symptoms": "Small, yellow flecks on lower leaves that expand into reddish-brown, rectangular lesions with tiny black specks (pycnidia) inside.",
        "causes": "Fungus (Septoria tritici / Zymoseptoria tritici) spread by rain splash and high humidity.",
        "treatments": [
            "Apply multi-site or systemic fungicides (e.g., SDHIs, triazoles) at critical growth stages (flag leaf emergence).",
            "Incorporate crop residues to aid decomposition."
        ],
        "prevention": [
            "Choose varieties with strong resistance ratings.",
            "Rotate wheat with non-cereal crops for at least one year.",
            "Delay sowing in autumn to reduce early infection risk."
        ]
    }
}

def get_recommendation(class_name):
    """
    Returns disease description, symptoms, cause, treatments, and prevention tips.
    If the class is a known 'Healthy' class, it returns customized health details.
    Uses fallback logic for classes not explicitly in the dictionary.
    """
    # Check if we have exact match
    if class_name in DISEASE_DATA:
        return DISEASE_DATA[class_name]
        
    # Handle healthy classes
    if "healthy" in class_name.lower():
        parts = class_name.split("_")
        crop = parts[0] if len(parts) > 0 else "Crop"
        return {
            "disease": "Healthy",
            "crop": crop,
            "description": f"The {crop} leaf appears healthy with no visible signs of disease or pest damage.",
            "symptoms": "Green, uniform color, strong structure, and normal development appropriate for the growth stage.",
            "causes": "Optimal environmental conditions, adequate nutrient availability, and effective pest management.",
            "treatments": [
                "No treatment necessary.",
                "Continue standard watering and fertilization schedule."
            ],
            "prevention": [
                "Maintain good field sanitation.",
                "Inspect crops regularly for early signs of pests or disease.",
                "Apply balanced fertilizers and irrigate properly."
            ]
        }
        
    # General fallback parser
    parts = class_name.split("_")
    crop = parts[0] if len(parts) > 0 else "Crop"
    disease_words = parts[1:] if len(parts) > 1 else ["Disease"]
    disease = " ".join(disease_words).replace("_", " ").title()
    
    # Generic advice based on disease type keywords
    disease_lower = disease.lower()
    
    if "blight" in disease_lower:
        desc = f"A type of plant disease caused by pathogenic organisms resulting in rapid and complete chlorosis, browning, and death of plant tissues."
        symp = "Dark, water-soaked spots on leaves or stems that expand rapidly and can kill the entire leaf or plant."
        cause = "Fungal or bacterial pathogens, often spread by splashing water or wind during wet conditions."
        treats = ["Apply appropriate copper-based or synthetic fungicides/bactericides.", "Prune and destroy infected plant parts."]
        prevs = ["Keep foliage dry, water at the soil level.", "Space plants for proper air circulation.", "Rotate crops yearly."]
    elif "rust" in disease_lower:
        desc = f"A fungal disease that affects plants, characterized by rusty or reddish-brown powdery spores on leaves and stems."
        symp = "Orange, yellow, or reddish-brown powdery pustules or spots, usually on the underside of leaves."
        cause = "Rust fungi (Puccinia spp. or related genera) which spread easily through wind-borne spores."
        treats = ["Apply sulfur or copper fungicides.", "Remove heavily infected leaves to limit spore spread."]
        prevs = ["Plant resistant crop varieties.", "Avoid overhead irrigation.", "Remove weed hosts near the crop."]
    elif "rot" in disease_lower:
        desc = f"A condition characterized by decay of plant tissue, usually caused by fungal or bacterial infection."
        symp = "Soft, mushy, discolored areas on leaves, stems, or fruit, often accompanied by an unpleasant odor."
        cause = "Soil-borne fungi or bacteria, usually thriving in overly wet or poorly drained soils."
        treats = ["Apply specialized fungicides.", "Improve drainage and reduce watering immediately.", "Remove decaying plant parts."]
        prevs = ["Avoid overwatering and ensure excellent soil drainage.", "Use clean seeds and planting materials.", "Rotate crops."]
    elif "spot" in disease_lower or "smut" in disease_lower:
        desc = f"A common plant disease that causes localized lesions on leaves, stems, or fruits, reducing photosynthesis."
        symp = "Small, dark spots on leaves, sometimes with a yellow halo or concentric rings."
        cause = "Fungi, bacteria, or other pathogens spreading via wind, rain, or garden tools."
        treats = ["Apply copper-based fungicides or bio-fungicides.", "Prune lower leaves to reduce soil splash."]
        prevs = ["Provide adequate spacing for airflow.", "Avoid watering foliage in the evening.", "Clean garden tools regularly."]
    elif "virus" in disease_lower or "curl" in disease_lower or "mosaic" in disease_lower:
        desc = f"A viral disease that disrupts the plant's normal growth, chlorophyll production, and development."
        symp = "Mottled yellow and green leaves, curling, stunting, distorted growth, or deformed fruit."
        cause = "Plant viruses, commonly transmitted by insect vectors like aphids, whiteflies, or thrips."
        treats = ["There is no cure for viral plant diseases. Immediately remove and destroy infected plants.", "Control insect vectors using insecticidal soaps or neem oil."]
        prevs = ["Use certified virus-free seeds.", "Install insect-proof netting.", "Keep the area weed-free to eliminate alternate hosts."]
    elif "mites" in disease_lower or "pest" in disease_lower:
        desc = f"An infestation of tiny arachnids or insects that feed on the sap of the plant, causing stress and damage."
        symp = "Fine webbing on the undersides of leaves, stippling (tiny yellow dots) on upper surfaces, and bronzing of leaves."
        cause = "Spider mites or other sap-sucking pests, often thriving in hot, dry conditions."
        treats = ["Spray with insecticidal soap, neem oil, or miticides.", "Wash plants with a strong stream of water to dislodge pests."]
        prevs = ["Keep plants well-watered (stressed plants are more susceptible).", "Introduce natural predators like ladybugs or predatory mites."]
    else:
        desc = f"A disease affecting {crop} plants, leading to reduced health and yield."
        symp = "Discoloration, spots, or abnormal growth on the leaves."
        cause = "Pathogenic infection (fungus, bacteria, or virus)."
        treats = ["Identify the specific pathogen for targeted treatment.", "Apply general broad-spectrum copper fungicide."]
        prevs = ["Practice crop rotation.", "Maintain field hygiene.", "Avoid overhead irrigation."]

    return {
        "disease": disease,
        "crop": crop,
        "description": desc,
        "symptoms": symp,
        "causes": cause,
        "treatments": treats,
        "prevention": prevs
    }
