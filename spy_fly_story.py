import textwrap

story = ''' You are a secret spy in disguise piloting an electric plane with a classified mission to collect information about a continent of your choice. You have heard that some countries are violating allowed co2_emission regulations, therefore the information you need to collect is crucial for a further investigation.  

After charging your plane before the mission and taking your best disguise, you are ready to go! Your goal is to collect as much information as possible before your battery runs out and avoid getting caught too early. 

You are starting your mission in a random airport in the continent that you selected. Then you can choose your next destination to fly to. The battery power that you need to travel depends on the distances between two airports. Flying in bad weather conditions needs more resources. After landing, you can start detecting the airports and gather information that you need and send it back to the headquarters. After successfully sending the information back, you will receive points from that. Then your mission continues. 

However, two airports will have top-level airport patrols. If you land in one of the places, you will get caught and you cannot continue your mission anymore. Fortunately, you have already sent the information that you collected back. Your contribution is recognized!  

Your superior informed you that there are eight airports where you can find the power station to charge your plane. If you land in one of those airports, your plane can detect the accurate location of the power station. However, your superior also mentioned that there’s a chance of getting caught if you decided to charge your battery there. Now, the decision is yours to take – You can play safe by leaving the airport immediately to the next airport without gathering information at all. But you wasted the resources you used to travel here. Or you can take the risk. You will charge 10% of your battery and collect information at the same time. If you do not get caught from this, you will gain 10% more battery and points.  

Make sure you are wise when making your choices, but don’t forget to collect at least 100 points before getting caught or running out of battery, in which case the information you collected won’t be sufficient.  

God speed, recruit.

'''

wrapper = textwrap.TextWrapper(width=80, break_long_words=False, replace_whitespace=False)

word_list = wrapper.wrap(text=story)


def get_story():
    return word_list

