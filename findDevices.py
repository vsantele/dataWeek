import os
import socket
import multiprocessing
import subprocess
import argparse
import re


def pinger(job_q, results_q):
    """
    Do Ping
    :param job_q:
    :param results_q:
    :return:
    """
    DEVNULL = open(os.devnull, "w")
    while True:

        ip = job_q.get()

        if ip is None:
            break

        try:
            subprocess.check_call(["ping", "-c1", ip], stdout=DEVNULL)
            results_q.put(ip)
        except:
            pass


def get_my_ip():
    """
    Find my IP address
    :return:
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]
    s.close()
    return ip


def map_network(pool_size=255, ip=get_my_ip(), block=1):
    """
    Maps the network
    :param pool_size: amount of parallel ping processes
    :return: list of valid ip addresses
    """

    ip_list = list()

    # get my IP and compose a base like 192.168.1.xxx
    ip_parts = ip.split(".")
    if block == 1:
        base_ip = ip_parts[0] + "." + ip_parts[1] + "." + ip_parts[2] + "."
    elif block == 2:
        base_ip = ip_parts[0] + "." + ip_parts[1] + "."
    elif block == 3:
        base_ip = ip_parts[0] + "."
    else:
        base_ip = ip_parts[0] + "." + ip_parts[1] + "." + ip_parts[2] + "."
    # prepare the jobs queue
    jobs = multiprocessing.Queue()
    results = multiprocessing.Queue()

    pool = [
        multiprocessing.Process(target=pinger, args=(jobs, results))
        for i in range(pool_size)
    ]

    for p in pool:
        p.start()

    # cue hte ping processes
    if block == 1:
        for i in range(1, 255):
            ip = base_ip + "{0}".format(i)
            jobs.put(ip)
    elif block == 2:
        for i in range(1, 255):
            for j in range(1, 255):
                ip = base_ip + "{0}".format(i) + ".{0}".format(j)
                jobs.put(ip)
    elif block == 3:
        for i in range(1, 255):
            for j in range(1, 255):
                for k in range(1, 255):
                    ip = base_ip + "{0}".format(i) + ".{0}".format(j) + ".{0}".format(k)
                    jobs.put(ip)

    for p in pool:
        jobs.put(None)

    for p in pool:
        p.join()

    # collect he results
    while not results.empty():
        ip = results.get()
        ip_list.append(ip)

    return ip_list


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Scan network")
    parser.add_argument(
        "network",
        type=str,
        nargs="?",
        help="an IP address for the scan",
        default=get_my_ip(),
    )
    parser.add_argument(
        "-b", "--block", type=int, choices=[1, 2, 3], default=1,
    )

    args = parser.parse_args()
    if re.match(r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$", args.network) is None:
        print("IP is not valid")
    else:
        print("Mapping...")
        lst = map_network(pool_size=255, ip=args.network, block=args.block)
        print(lst)
